import { WorkspacesTwoTone } from '@mui/icons-material';
import {
  Button, Menu, MenuItem, TextField, Tooltip,
} from '@mui/material';
import * as React from 'react';

export const ButtonsGroupBulk: React.FC<{
  onSelect: (groupId: string | null) => void,
  disabled?: boolean,
  groups: (string | null)[],
}> = ({
  onSelect,
  disabled,
  groups,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [input, setInput] = React.useState('');
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const selectGroup = React.useCallback((group: string | null) => {
    onSelect(group);
    handleClose();
  }, [onSelect]);

  const handleKeyDown = React.useCallback<React.KeyboardEventHandler<HTMLDivElement>>((event) => {
    if ((event.nativeEvent.code === 'Enter' || event.code === 'NumpadEnter') && input.length > 0) {
      event.preventDefault();
      selectGroup(input);
    }
  }, [input, selectGroup]);

  const groupsWithNull = React.useMemo(() => {
    if (groups.includes(null)) {
      return groups;
    } else {
      return [null, ...groups];
    }
  }, [groups]);

  return (
    <>
      <Tooltip arrow title="Change group">
        <Button
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          disabled={disabled}
          variant="contained"
          color="info"
          sx={{ minWidth: '36px', width: '36px' }}
        >
          <WorkspacesTwoTone/>
        </Button>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        sx={{ paddingBottom: 0 }}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
      >
        {groupsWithNull.map((group) => {
          return (<MenuItem key={group} onClick={() => selectGroup(group)}>{group || 'Remove group'}</MenuItem>);
        })}
        <TextField variant='filled' label="Create group" size='small' onKeyDown={handleKeyDown} onChange={(ev) => setInput(ev.target.value)}/>
      </Menu>
    </>
  );
};