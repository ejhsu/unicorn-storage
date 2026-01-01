import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';

import { SORT_OPTIONS } from '../../constants/sort';

const SortDialog = ({ open, onClose, onItemClick, currentSort }) => {
  if (!open) {
    return null;
  }

  const handleItemClick = (sortKey) => {
    onItemClick(sortKey);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth classes={{ paper: 'border2d' }}>
      <DialogTitle component="div" className="flex justify-between items-center p-4 py-1">
        <Typography variant="h6" className="font-semibold">
          排序方式
        </Typography>
        <IconButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider className="h-1" />
      <DialogContent className="px-0 py-0">
        <Box className="">
          <List>
            {SORT_OPTIONS.map((option) => (
              <ListItem key={option.key} disablePadding sx={{ backgroundColor: currentSort === option.key ? 'primary.main' : 'inherit' }}>
                <ListItemButton className="w-full" selected={currentSort === option.key} onClick={() => handleItemClick(option.key)}>
                  <ListItemText primary={option.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default SortDialog;
