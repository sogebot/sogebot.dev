import { Alert, AlertTitle, LoadingButton } from '@mui/lab';
import { Link, TextField, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import axios from 'axios';
import parse from 'html-react-parser';
import { capitalize } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { v4 } from 'uuid';

import { useTranslation } from '../../hooks/useTranslation';

export const TestUserField: React.FC<{ permissionId: string }> = ({
  permissionId,
}) => {
  const { translate } = useTranslation();

  const [ testUserName, setTestUserName ] = useState('');
  const [ error, setError ] = useState('');
  const [ status, setStatus ] = useState<any>({ access: undefined });
  const [ partialStatus, setPartialStatus ] = useState<any>({ access: undefined });
  const [ isTesting, setIsTesting ] = useState(false);

  useEffect(() => {
    setStatus({ access: undefined });
    setPartialStatus({ access: undefined });
    setError('');
  }, [testUserName]);

  const color = useMemo(() => {
    try {
      if (Number(status.access) === 0 && Number(partialStatus.access) === 0) {
        return 'error';
      } else if (Number(status.access) === 1 && Number(partialStatus.access) === 1) {
        return 'success';
      } else {
        throw new Error();
      }
    } catch {
      return 'info';
    }
  }, [ partialStatus.access, status.access ]);

  const testUser = () => {
    setIsTesting(true);
    const state = v4();

    setStatus({ access: undefined });
    setPartialStatus({ access: undefined });
    setError('');

    if (testUserName.trim().length === 0) {
      setIsTesting(false);
    } else {
      axios.post('/api/core/permissions/?_action=testUser', {
        pid: permissionId, value: testUserName, state,
      }).then(({ data }) => {
        console.log({ data });
        if (data.data.state === state) {
          // expecting this data
          setStatus(data.data.status);
          setPartialStatus(data.data.partial);
          setIsTesting(false);
        }
      }).catch(err => {
        setError(err instanceof Error ? err.stack ?? '' : String(err));
        setIsTesting(false);
        console.error(translate('core.permissions.' + err));
      });
    }
  };

  return <>
    <Stack direction='row'>
      <TextField
        fullWidth
        variant="filled"
        value={testUserName}
        required
        onChange={(event) => setTestUserName(event.target.value)}
        label={capitalize(translate('core.permissions.testUser'))}
      />
      <LoadingButton
        loading={isTesting}
        sx={{
          minWidth: '200px', my: 1, ml: 1,
        }}
        variant='contained'
        onClick={testUser}>Test</LoadingButton>
    </Stack>

    {error.length > 0 && <Alert severity='error' >
      <AlertTitle>{ translate('core.permissions.' + error) }</AlertTitle>
    </Alert>}

    {status.access !== undefined && partialStatus !== undefined && <Alert severity={color}>
      {(Number(status.access) === 0 && Number(partialStatus.access) === 0) && <AlertTitle>
        {parse(translate('core.permissions.userHaveNoAccessToThisPermissionGroup').replace('$username', testUserName))}
      </AlertTitle>
      }
      {(Number(status.access) === 1 || Number(partialStatus.access) === 1) && <>
        <AlertTitle>
          {parse(translate('core.permissions.userHaveAccessToThisPermissionGroup').replace('$username', testUserName))}
        </AlertTitle>
        <ul style={{ marginBottom: 0 }}>
          {Number(partialStatus.access) === 1 && <li>
            {parse(translate('core.permissions.accessDirectlyThrough'))}&nbsp;
            <Typography component='span'>
              <Link href={`/settings/permissions/${partialStatus.permission.id}`}>
                { partialStatus.permission.name }
              </Link>
              &nbsp;
              <small>{ partialStatus.permission.id }</small>
            </Typography>
          </li>}
          {(Number(status.access) === 1 && status.permission.id !== partialStatus.permission.id) && <li>
            {parse(translate('core.permissions.accessThroughHigherPermission'))}&nbsp;
            <Typography component='span'>
              <Link href={`/settings/permissions/${status.permission.id}`}>
                { status.permission.name }
              </Link>
              &nbsp;
              <small>{ status.permission.id }</small>
            </Typography>
          </li>}
        </ul>
      </>}

      {(Number(status.access) === 2 || Number(partialStatus.access) === 2) && <AlertTitle>
        {parse(translate('core.permissions.somethingWentWrongUserWasNotFoundInBotDatabase').replace('$username', testUserName))}
      </AlertTitle>
      }
    </Alert>}
  </>;

};