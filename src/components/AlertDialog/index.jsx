import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import classNames from "classnames";

const AlertDialog = ({ open, onClose, title, description, mode = 'confirm', cancelText = '取消', confirmText = '確認', onCancel = onClose, onConfirm, }) => {
  if (!open) {
    return null;
  }

  const getTitleClassname = () => {
    let className = 'text-gray-600';
    switch (mode) {
      case 'success':
        className = 'text-green-600';
        break;
      case 'error':
        className = 'text-red-600';
        break;
      default:
        break;
    }
    return className;
  };
  const getDescriptionClassname = () => {
    let className = '';
    switch (mode) {
      case 'success':
        className = 'text-[#3DC40C]';
        break;
      case 'error':
        className = 'text-[#FF0000]';
        break;
      default:
        break;
    }
    return className;
  };
  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth classes={{paper: 'border2d'}}>
      <Box className="p-4">
        {title && <Box className="flex justify-center">
          <DialogTitle className={classNames("font-semibold", getTitleClassname())}>{title}</DialogTitle>
        </Box>}

        {description && <DialogContent className="pt-2 pb-4 px-0">
          <Typography color="textPrimary" align="center" className={classNames('text-xl', getDescriptionClassname())}>
            {description}
          </Typography>
        </DialogContent>
        }

        {(cancelText || confirmText) && <DialogActions className="justify-around px-16">
          {cancelText && <Button onClick={onCancel} className="text-black text-xl">
            {cancelText}
          </Button>}
          {confirmText && <Button onClick={onConfirm} className="text-[#FF0000] text-xl">
            {confirmText}
          </Button>}
        </DialogActions>
        }
      </Box>
    </Dialog>
  );
};

export default AlertDialog;
