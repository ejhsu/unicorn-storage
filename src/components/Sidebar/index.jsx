import AddIcon from '@mui/icons-material/Add';
import ListIcon from '@mui/icons-material/List';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';

const listItems = [
  { text: 'add', icon: <AddIcon /> },
  { text: 'list', icon: <ListIcon /> },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <Drawer open={open} onClose={onClose}>
      <Box role="presentation">
        <List>
          {listItems.map(({ text, icon }) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>{icon}</ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
