import { Box, Card, Typography } from '@mui/material';
import { differenceInDays, endOfDay, fromUnixTime, getUnixTime } from 'date-fns';
import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

import { STATUS } from '../../constants/status';

const ItemCard = ({ item, onClick }) => {
  const { name, expiry } = item;
  const days = differenceInDays(expiry, getUnixTime(fromZonedTime(endOfDay(new Date()), 'Asia/Taipei')) * 1000);
  const status = (() => {
    if (days < 0) {
      return STATUS.EXPIRED;
    }
    if (days === 0) {
      return STATUS.EXPIRED_TODAY;
    }
    if (days <= 7) {
      return STATUS.EXPIRED_SOON;
    }
    return STATUS.GOOD;
  })();

  return (
    <Card
      id={item.docId}
      className="flex flex-col w-full border-3 border-solid border-black h-28 rounded-lg pl-5 pr-3 py-2 shadow-lg justify-between"
      onClick={() => onClick(item)}
    >
      <Box className="flex">
        <Typography variant="h6" className="font-normal truncate w-2/3">
          {name}
        </Typography>
      </Box>
      <Box className="flex items-center gap-1">
        <Box className="size-5 rounded-full border-3" sx={{ bgcolor: status.color }} />
        <Typography variant="caption">{status.text.replace('{{day}}', days)}</Typography>
      </Box>
      <Box className="flex">
        <Typography color="#6C6C6C">{formatInTimeZone(fromUnixTime(expiry / 1000), 'Asia/Taipei', 'yyyy/MM/dd')}</Typography>
      </Box>
    </Card>
  );
};

export default ItemCard;
