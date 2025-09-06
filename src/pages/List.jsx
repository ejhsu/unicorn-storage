import './List.css';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SortIcon from '@mui/icons-material/Sort';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, CircularProgress, Fab, Typography } from '@mui/material';
import { collection, getDocs } from 'firebase/firestore';
import { isEmpty } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import {
  LeadingActions,
  SwipeableList,
  SwipeableListItem,
  SwipeAction,
  TrailingActions,
  Type,
} from 'react-swipeable-list';

import AlertDialog from '../components/AlertDialog';
import ItemCard from '../components/ItemCard';
import { auth, db } from '../services/firebase';


import 'react-swipeable-list/dist/styles.css';
import { deleteItem, duplicateItem } from '../services/item';
import SortDialog from '../components/SortDialog';
import { SORT_OPTIONS } from '../constants/sort';

function List() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const itemId = state?.itemId;

  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sorting, setSorting] = useState(SORT_OPTIONS[0].key);
  const [items, setItems] = useState([]);
  const [alertMessage, setAlertMessage] = useState(null);

  const handleItemClick = (item) => {
    navigate(`/items/${item.docId}`);
  };

  const handleSortClick = () => {
    setSortDialogOpen(true);
  };

  const fetchItems = async () => {
    const q = collection(db, "storage/1/items");
    try {
      const querySnapshot = await getDocs(q);
      setItems(querySnapshot.docs.map(doc => doc.data()).sort(((item1, item2) => {
        return item1.expiry - item2.expiry || item1.name.localeCompare(item2.name);
      })));
      setItemsLoaded(true);
    } catch (error) {
      if (error.code === 'permission-denied') {
        alert(`禁止${auth.currentUser.email}未授權的存取。`);
        auth.signOut();
      }
    }
  };

  const sortedItems = useMemo(() => {
    let sorted = [...items];
    switch (sorting) {
      case SORT_OPTIONS[0].key: // 'expiry_asc'
        sorted = sorted.sort((item1, item2) => item1.expiry - item2.expiry);
        break;
      case SORT_OPTIONS[3].key: // 'expiry_desc'
        sorted = sorted.sort((item1, item2) => item2.expiry - item1.expiry);
        break;
      case SORT_OPTIONS[1].key: // 'name_asc'
        sorted = sorted.sort((item1, item2) => item1.name.localeCompare(item2.name));
        break;
      case SORT_OPTIONS[2].key: // 'name_desc'
        sorted = sorted.sort((item1, item2) => item2.name.localeCompare(item1.name));
        break;
      case SORT_OPTIONS[4].key: // 'created_asc'
        sorted = sorted.sort((item1, item2) => item1.created - item2.created);
        break;
      case SORT_OPTIONS[5].key: // 'created_desc'
        sorted = sorted.sort((item1, item2) => item2.created - item1.created);
        break;
      default:
        break;
    }
    return sorted;
  }, [sorting, items]);

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (itemsLoaded && itemId) {
      document.getElementById(itemId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [itemsLoaded, itemId]);


  const leadingActions = (item) => (
    <LeadingActions>
      <SwipeAction onClick={async () => {
        await duplicateItem(item);
        fetchItems();
        setAlertMessage({
          title: '複製成功',
          cancelText: '',
          confirmText: '',
          mode: 'success',
        });
        setTimeout(() => {
          setAlertMessage(null);
        }, 1500);
      }}>
        <Box className="border2d w-20" sx={{ backgroundColor: 'primary.main' }}>
          <Box className="flex justify-center items-center h-full">
            <ContentCopyIcon className="size-8" />
          </Box>
        </Box>
      </SwipeAction>
    </LeadingActions>
  );

  const trailingActions = (item) => (
    <TrailingActions>
      <SwipeAction onClick={() => {
        setAlertMessage({
          description: '確定刪除所選品項?',
          cancelText: '取消',
          confirmText: '刪除',
          onClose: () => {
            setAlertMessage(null);
          },
          onConfirm: async () => {
            await deleteItem(item.docId);
            fetchItems();
            setAlertMessage({
              title: '刪除成功',
              cancelText: '',
              confirmText: '',
              mode: 'error',
            });
            setTimeout(() => {
              setAlertMessage(null);
            }, 1500);
          },
          mode: 'confirm',
        });
      }}>
        <Box className="border2d w-20" sx={{ backgroundColor: 'primary.main' }}>
          <Box className="flex justify-center items-center h-full">
            <DeleteIcon className="size-8 text-[#FC0005]" />
          </Box>
        </Box>
      </SwipeAction>
    </TrailingActions>
  );

  let listContent = <SwipeableList type={Type.IOS}>
    {sortedItems.map((item) =>
      <SwipeableListItem
        key={item.docId}
        className='mb-3'
        threshold={0.5}
        leadingActions={leadingActions(item)}
        trailingActions={trailingActions(item)}
      >
        <ItemCard key={item.docId} item={item} onClick={handleItemClick} />
      </SwipeableListItem>)}
  </SwipeableList>;

  if (!itemsLoaded) {
    listContent = <Box className="flex items-center h-full">
      <CircularProgress />
    </Box>;
  } else if (isEmpty(items)) {
    listContent = <Box className="flex items-center h-full">
      <Typography variant="body1" className="text-xl text-[#6C6C6C]">點選新增(+)按鈕開始建立清單</Typography>
    </Box>;
  }

  return (
    <>
      <Box className="p-4 flex flex-col w-full h-full justify-baseline items-center">
        {listContent}
      </Box>
      <Box className='fixed bottom-8 right-8 flex flex-col items-center gap-4'>
        <Fab className='size-[45px] rounded-[10px] border-3 border-solid border-black' color="primary" onClick={handleSortClick}>
          <SortIcon className="size-7 font-black text-black" />
        </Fab>
        <Fab className='size-[60px] rounded-[10px] border-3 border-solid border-black' color="primary" onClick={() => {
          Notification.requestPermission();
          navigate('/items');
        }}>
          <AddIcon className="size-10 font-black text-black" />
        </Fab>
      </Box>
      <SortDialog
        open={sortDialogOpen}
        onClose={() => setSortDialogOpen(false)}
        onItemClick={(sortKey) => {
          setSorting(sortKey);
        }}
        currentSort={sorting}
      />
      <AlertDialog
        open={!isEmpty(alertMessage)}
        {...alertMessage}
      />
    </>
  );
}

export default List;
