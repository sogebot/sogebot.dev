import { validate } from 'class-validator';
import { Plugin } from './entity/Plugin';
import express from 'express';
import { Request, Response } from "express"
import { AppDataSource } from './data-source';
import axios from 'axios';
import cors from 'cors';
import morgan from 'morgan';

AppDataSource.initialize()
    .then(() => {
        console.log("Started OK")
    })
    .catch((err) => {
        console.error("Error during Data Source initialization", err)
    })

// create and setup express app
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true, limit: '500mb' }));
app.use(express.raw());
app.use(cors());
morgan.token('user', function (req) {
  const value = `${(req as any).login}#${(req as any).userId}`;
  return (req as any).login ? value : '<unknown user>';
})
app.use(morgan(':remote-addr - :user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'))

// add twitch validation
/*
curl -X GET 'https://id.twitch.tv/oauth2/validate' \
-H 'Authorization: OAuth <access token to validate goes here>'

{
  "client_id": "wbmytr93xzw8zbg0p1izqyzzc5mbiz",
  "login": "twitchdev",
  "scopes": [
    "channel:read:subscriptions"
  ],
  "user_id": "141981764",
  "expires_in": 5520838
}
*/
const adminMiddleware = async (req: any, res: Response, next: () => void) => {
    try {
      const authHeader = req.headers.authorization;
      const authToken = authHeader && authHeader.split(' ')[1];

      if (authToken == null) {
        return res.sendStatus(401);
      }

      const url = 'https://id.twitch.tv/oauth2/validate';
      const request = await axios.get<{
        expires_in: number,
        user_id: string,
        login: string,
        scopes: string[]
      }>(url, {
        headers: {
          Authorization: 'OAuth ' + authToken,
        },
      });

      req.userId = request.data.user_id
      req.login = request.data.login
      next();
    } catch (e) {
      return res.sendStatus(401);
    }
  };

// register routes
app.get("/plugins", adminMiddleware, async function (req: Request, res: Response) {
  // we need to remove plugins to save bandwidth (it is not needed for full plugins search)
  return res.json(await AppDataSource.getRepository(Plugin).find({ select: {
    id: true,
    description: true,
    name: true,
    votes: true,
    publishedAt: true,
    publisherId: true,
    version: true,
    importedCount: true,
  }}))
})

app.get("/plugins/:id", adminMiddleware, async function (req: Request, res: Response) {
    await AppDataSource.getRepository(Plugin).increment({
      id: req.params.id,
    }, 'importedCount', 1);

    const results = await AppDataSource.getRepository(Plugin).findOneBy({
        id: req.params.id,
    })

    return res.send(results)
})

app.post("/plugins", adminMiddleware, async function (req: any, res: Response) {
    const plugin = await AppDataSource.getRepository(Plugin).create({
      ...req.body,
      publisherId: req.userId,
      publishedAt: new Date().toISOString(),
      votes: [],
      version: 1,
    })

    const errors = await validate(plugin)
    if (errors.length > 0) {
        return res.status(400).json(errors);
    } else {
        const results = await AppDataSource.getRepository(Plugin).save(plugin)
        return res.send(results)
    }
})

app.put("/plugins/:id", adminMiddleware, async function (req: any, res: Response) {
    const plugin = await AppDataSource.getRepository(Plugin).findOneBy({
        id: req.params.id,
    })
    if (plugin) {
      if (plugin.publisherId !== req.userId) {
        return res.status(401).send('You cannot update plugin, which doesn\'t belong to you.')
      }

        AppDataSource.getRepository(Plugin).merge(plugin, req.body, { version: plugin.version + 1 })

        const errors = await validate(plugin)
        if (errors.length > 0) {
            return res.status(400).json(errors);
        } else {
            const results = await AppDataSource.getRepository(Plugin).save(plugin)
            return res.send(results)
        }
    } else {
        return res.status(404).send('Plugin not found')
    }
})

app.delete("/plugins/:id", adminMiddleware, async function (req: Request, res: Response) {
    const results = await AppDataSource.getRepository(Plugin).delete(req.params.id)
    return res.send(results)
})

// start express server
app.listen(process.env.PORT || 3000);