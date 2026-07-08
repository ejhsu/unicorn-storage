import { Box } from '@mui/material';

const ListAction = ({ children, className = '', sx = {} }) => {
  return (
    <Box
      className={`border2d w-20 ${className}`}
      sx={{ backgroundColor: 'primary.main', '&:hover, &:active': { backgroundColor: 'primary.main' }, ...sx }}
    >
      <Box className="flex justify-center items-center h-full">{children}</Box>
    </Box>
  );
};

export default ListAction;
