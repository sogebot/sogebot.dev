"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const class_validator_1 = require("class-validator");
const Plugin_1 = require("./entity/Plugin");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const data_source_1 = require("./data-source");
const axios_1 = (0, tslib_1.__importDefault)(require("axios"));
const cors_1 = (0, tslib_1.__importDefault)(require("cors"));
const morgan_1 = (0, tslib_1.__importDefault)(require("morgan"));
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Started OK");
})
    .catch((err) => {
    console.error("Error during Data Source initialization", err);
});
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true, limit: '500mb' }));
app.use(express_1.default.raw());
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('combined'));
const adminMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const authToken = authHeader && authHeader.split(' ')[1];
        if (authToken == null) {
            return res.sendStatus(401);
        }
        const url = 'https://id.twitch.tv/oauth2/validate';
        const request = await axios_1.default.get(url, {
            headers: {
                Authorization: 'OAuth ' + authToken,
            },
        });
        req.userId = request.data.user_id;
        next();
    }
    catch (e) {
        return res.sendStatus(401);
    }
};
app.get("/plugins", adminMiddleware, async function (req, res) {
    return res.json(await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).find({ select: {
            id: true,
            description: true,
            name: true,
            votes: true,
            publishedAt: true,
            publisherId: true,
            version: true,
        } }));
});
app.get("/plugins/:id", adminMiddleware, async function (req, res) {
    const results = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).findOneBy({
        id: req.params.id,
    });
    return res.send(results);
});
app.post("/plugins", adminMiddleware, async function (req, res) {
    const plugin = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).create({
        ...req.body,
        publisherId: req.userId,
        publishedAt: new Date().toISOString(),
        votes: [],
        version: 1,
    });
    const errors = await (0, class_validator_1.validate)(plugin);
    if (errors.length > 0) {
        return res.status(400).json(errors);
    }
    else {
        const results = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).save(plugin);
        return res.send(results);
    }
});
app.put("/plugins/:id", adminMiddleware, async function (req, res) {
    const plugin = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).findOneBy({
        id: req.params.id,
    });
    if (plugin) {
        if (plugin.publisherId !== req.userId) {
            return res.status(401).send('You cannot update plugin, which doesn\'t belong to you.');
        }
        data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).merge(plugin, req.body, { version: plugin.version + 1 });
        const errors = await (0, class_validator_1.validate)(plugin);
        if (errors.length > 0) {
            return res.status(400).json(errors);
        }
        else {
            const results = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).save(plugin);
            return res.send(results);
        }
    }
    else {
        return res.status(404).send('Plugin not found');
    }
});
app.delete("/plugins/:id", adminMiddleware, async function (req, res) {
    const results = await data_source_1.AppDataSource.getRepository(Plugin_1.Plugin).delete(req.params.id);
    return res.send(results);
});
app.listen(process.env.PORT || 3000);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEscURBQTJDO0FBQzNDLDRDQUF5QztBQUN6QyxtRUFBOEI7QUFFOUIsK0NBQThDO0FBQzlDLCtEQUEwQjtBQUMxQiw2REFBd0I7QUFDeEIsaUVBQTRCO0FBRTVCLDJCQUFhLENBQUMsVUFBVSxFQUFFO0tBQ3JCLElBQUksQ0FBQyxHQUFHLEVBQUU7SUFDUCxPQUFPLENBQUMsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFBO0FBQzdCLENBQUMsQ0FBQztLQUNELEtBQUssQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO0lBQ1gsT0FBTyxDQUFDLEtBQUssQ0FBQyx5Q0FBeUMsRUFBRSxHQUFHLENBQUMsQ0FBQTtBQUNqRSxDQUFDLENBQUMsQ0FBQTtBQUdOLE1BQU0sR0FBRyxHQUFHLElBQUEsaUJBQU8sR0FBRSxDQUFBO0FBQ3JCLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO0FBQ3ZCLEdBQUcsQ0FBQyxHQUFHLENBQUMsaUJBQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDaEUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxpQkFBTyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUM7QUFDdkIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGNBQUksR0FBRSxDQUFDLENBQUM7QUFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFBLGdCQUFNLEVBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQTtBQWlCM0IsTUFBTSxlQUFlLEdBQUcsS0FBSyxFQUFFLEdBQVEsRUFBRSxHQUFhLEVBQUUsSUFBZ0IsRUFBRSxFQUFFO0lBQ3hFLElBQUk7UUFDRixNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsT0FBTyxD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