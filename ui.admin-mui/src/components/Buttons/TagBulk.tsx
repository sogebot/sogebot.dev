import { LabelTwoTone } from '@mui/icons-material';
import {
  Autocomplete,
  Button, Chip, createFilterOptions, Menu, Stack, TextField, Tooltip,
} from '@mui/material';
import * as React from 'react';

import { useTranslation } from '~/src/hooks/useTranslation';

export const ButtonsTagBulk: React.FC<{
  onSelect: (groupId: string[]) => void,
  disabled?: boolean,
  tags: (string | null)[],
  forceTags?: string[],
}> = ({
  onSelect,
  disabled,
  tags,
  forceTags,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [value, setValue] = React.useState<any[]>((forceTags ?? []).map(v => ({
    title: v, value: v,
  })));
  const open = Boolean(anchorEl);
  const { translate } = useTranslation();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = React.useCallback(() => {
    setAnchorEl(null);
    setValue((forceTags ?? []).map(v => ({
      title: v, value: v,
    })));
  }, [forceTags]);

  const handleSave = React.useCallback(() => {
    onSelect(value.map(o => o.value));
    handleClose();
  }, [ value, onSelect, handleClose ]);

  const tagsItems = tags.map(tag => ({
    title: tag, value: tag,
  }));
  const filter = createFilterOptions<typeof tagsItems[number]>();

  const handleValueChange = React.useCallback((val: string[]) => {
    setValue(val.map(v => ({
      title: v, value: v,
    })));
  }, []);

  return (
    <>
      <Tooltip arrow title="Change tag">
        <Button
          aria-controls={open ? 'basic-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          disabled={disabled}
          variant="contained"
          color="info"
          sx={{
            minWidth: '36px', width: '36px',
          }}
        >
          <LabelTwoTone/>
        </Button>
      </Tooltip>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width:             '500px',
            '& .MuiList-root': { padding: '0 !important' },
          },
        }}
        MenuListProps={{ 'aria-labelledby': 'basic-button' }}
      >
        <Autocomplete
          value={value}
          multiple
          onChange={(event, newValue) => {
            if (Array.isArray(newValue)) {
              handleValueChange(Array.from(new Set([...(forceTags || []), ...newValue.map(o => typeof o === 'string' ? o : o.value)])));
            }
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);

            const { inputValue } = params;
            // Suggest the creation of a new value
            const isExisting = options.some((option) => inputValue === option.title);
            if (inputValue !== '' && !isExisting) {
              filtered.push({
                value: inputValue,
                title: `Add tag "${inputValue}"`,
              });
            }

            return filtered;
          }}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          options={tagsItems}
          getOptionLabel={(option) => {
          // Value selected with enter, right from the input
            if (typeof option === 'string') {
              return option;
            }
            // Add "xxx" option created dynamically
            if (option.value) {
              return option.value;
            }
            // Regular option
            return option.title;
          }}
          renderOption={(_props, option) => <li {..._props}>{option.title}</li>}
          isOptionEqualToValue={(option, v) => {
            return option.value === v.value;
          }}
          renderTags={(tagValue, getTagProps) =>
            tagValue.map((option, index) => (
              <Chip
                label={option.title}
                {...getTagProps({ index })}
                disabled={option.value==='general'}
                key={option.title}
                size="small"
              />
            ))
          }
          freeSolo
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              variant="filled"
              label={translate('systems.quotes.tags.name')}
              placeholder='Start typing to add tag'
            />
          )}
        />

        <Stack direction='row' justifyContent='space-between' p={0.5}>
          <Button sx={{ width: 200 }} onClick={handleClose}>Close</Button>
          <Button sx={{ width: 200 }} onClick={handleSave} variant='contained'>Save</Button>
        </Stack>
      </Menu>
    </>
  );
};