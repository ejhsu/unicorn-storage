import 'react-swipeable-list/dist/styles.css';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import { Box, CircularProgress, Fab, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { isEmpty } from 'lodash-es';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { LeadingActions, SwipeableList, SwipeableListItem, SwipeAction, TrailingActions, Type } from 'react-swipeable-list';

import AlertDialog from '../components/AlertDialog';
import ItemCard from '../components/ItemCard';
import ListAction from '../components/ListAction';
import SortDialog from '../components/SortDialog';
import { SORT_OPTIONS } from '../constants/sort';
import { auth } from '../services/firebase';
import { deleteItem, duplicateItem, getItems } from '../services/item';
import pkg from '../../package.json';

function List() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const itemId = state?.itemId;

  const [itemsLoaded, setItemsLoaded] = useState(false);
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sorting, setSorting] = useState(SORT_OPTIONS[0].key);
  const [items, setItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [alertMessage, setAlertMessage] = useState(null);
  const [showVersion, setShowVersion] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowVersion(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleItemClick = (item) => {
    navigate(`/items/${item.docId}`);
  };

  const handleSortClick = () => {
    setSortDialogOpen(true);
  };

  const fetchItems = async () => {
    try {
      const fetchedItems = await getItems();
      setItems(fetchedItems);
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
    if (searchQuery) {
      sorted = sorted.filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
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
  }, [sorting, items, searchQuery]);

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
      <SwipeAction
        onClick={async () => {
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
        }}
      >
        <ListAction>
          <ContentCopyIcon className="size-8" />
        </ListAction>
      </SwipeAction>
    </LeadingActions>
  );

  const trailingActions = (item) => (
    <TrailingActions>
      <SwipeAction
        onClick={() => {
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
        }}
      >
        <ListAction>
          <DeleteIcon className="size-8 text-[#FC0005]" />
        </ListAction>
      </SwipeAction>
    </TrailingActions>
  );

  let listContent = (
    <SwipeableList type={Type.IOS} className="!h-auto !overflow-y-visible">
      {sortedItems.map((item) => (
        <SwipeableListItem
          key={item.docId}
          className="mb-3"
          threshold={0.5}
          leadingActions={leadingActions(item)}
          trailingActions={trailingActions(item)}
        >
          <ItemCard key={item.docId} item={item} onClick={handleItemClick} />
        </SwipeableListItem>
      ))}
    </SwipeableList>
  );

  if (!itemsLoaded) {
    listContent = (
      <Box className="flex items-center flex-1">
        <CircularProgress />
      </Box>
    );
  } else if (isEmpty(items)) {
    listContent = (
      <Box className="flex items-center flex-1">
        <Typography variant="body1" className="text-xl text-[#6C6C6C]">
          點選新增(+)按鈕開始建立清單
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {showVersion && (
        <Typography
          variant="caption"
          className="fixed top-2 left-2 z-50 text-gray-400 pointer-events-none"
        >
          v{pkg.version}
        </Typography>
      )}
      <Box className="p-4 flex flex-col w-full h-full overflow-y-auto justify-start items-center">
        <TextField
          className="w-full mb-4"
          placeholder="搜尋"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchQuery('')}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
              className: 'rounded-lg bg-white',
              sx: {
                '& fieldset': {
                  border: '3px solid black',
                },
                '&:hover fieldset': {
                  border: '3px solid black',
                },
                '&.Mui-focused fieldset': {
                  border: '3px solid black',
                },
              },
            },
          }}
        />
        {listContent}
      </Box>
      <Box className="fixed bottom-8 right-8 flex flex-col items-center gap-4">
        <Fab className="size-[45px] rounded-[10px] border-3 border-solid border-black" color="primary" onClick={handleSortClick}>
          <SortIcon className="size-7 font-black text-black" />
        </Fab>
        <Fab
          className="size-[60px] rounded-[10px] border-3 border-solid border-black"
          color="primary"
          onClick={() => {
            Notification.requestPermission();
            if (localStorage.getItem('autoScan') === 'true') {
              navigate('/items/scan');
            } else {
              navigate('/items');
            }
          }}
        >
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
      <AlertDialog open={!isEmpty(alertMessage)} {...alertMessage} />
    </>
  );
}

export default List;
