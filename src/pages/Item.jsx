import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Button, FormControl, FormHelperText, FormLabel, IconButton, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { endOfDay, fromUnixTime, getUnixTime, isSameDay, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { fromZonedTime } from 'date-fns-tz';
import { isEmpty } from 'lodash-es';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router';

import AlertDialog from '../components/AlertDialog';
import { getCode, loadItem as fsLoadItem, setCode, upsertItem } from '../services/item';
import { TimeoutError, withTimeout } from '../utils/promise';

const SAVE_TIMEOUT_MS = 10000;

const toExpiry = (date) => getUnixTime(fromZonedTime(endOfDay(date), 'Asia/Taipei')) * 1000;

const getSaveErrorMessage = (error) => {
  if (error instanceof TimeoutError) {
    return '連線逾時，請確認網路後再試一次';
  }
  if (error?.code === 'permission-denied') {
    return '沒有儲存權限，請確認登入的帳號';
  }
  const codeSuffix = error?.code ? `（${error.code}）` : '';
  return `請稍後再試一次${codeSuffix}`;
};

const Item = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const { itemId } = useParams();

  const code = location.state?.code || null;

  const [alertMessage, setAlertMessage] = useState(null);
  const [item, setItem] = useState(null);
  const [saving, setSaving] = useState(false);
  // state 要等重新渲染才會讓按鈕 disabled，連點或按 Enter 的第二次送出靠 ref 擋下
  const savingRef = useRef(false);
  // 第一次送出的時刻。新品項的 docId/created 以它為準，逾時後重試會寫回同一份文件，
  // 先前那次寫入就算晚到也不會多出一筆
  const firstSubmitAtRef = useRef(null);
  // hold original expiry date if editing item
  const originalDateRef = useRef(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      date: itemId ? null : new Date(),
      note: '',
    },
  });

  // 可選的到期日：今天或之後；編輯時另外允許沿用原到期日
  const isSelectableDate = (date) =>
    toExpiry(date) >= Date.now() || (originalDateRef.current !== null && isSameDay(date, originalDateRef.current));

  const onSubmit = async (data) => {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);

    const now = Date.now();
    firstSubmitAtRef.current ??= now;
    const docId = item?.docId || `${firstSubmitAtRef.current}`;
    const itemCode = code || item?.code || '';
    try {
      await withTimeout(
        Promise.all([
          upsertItem(docId, {
            docId,
            name: data.name,
            expiry: toExpiry(data.date),
            created: item?.created || firstSubmitAtRef.current,
            updated: now,
            code: itemCode,
            note: data.note,
          }),
          itemCode ? setCode(itemCode, data.name) : null,
        ]),
        SAVE_TIMEOUT_MS,
      );
      // 成功後維持 loading 直到離開頁面，避免在提示期間再次送出
      setAlertMessage({
        title: '儲存成功',
        cancelText: '',
        confirmText: '',
        mode: 'success',
      });
      setTimeout(() => {
        setAlertMessage(null);
        handleBack(docId);
      }, 1500);
    } catch (error) {
      savingRef.current = false;
      setSaving(false);
      setAlertMessage({
        title: '儲存失敗',
        description: getSaveErrorMessage(error),
        mode: 'error',
        cancelText: '好',
        confirmText: '',
        onClose: () => {
          setAlertMessage(null);
        },
      });
    }
  };

  const handleBack = (docId) => {
    navigate('/', { state: { itemId: docId } });
  };

  const loadItem = useCallback(
    async (id) => {
      const data = await fsLoadItem(id);
      const date = fromUnixTime(data.expiry / 1000);
      originalDateRef.current = date;
      setItem(data);
      setValue('name', data.name);
      setValue('date', date);
      setValue('note', data.note || '');
    },
    [setValue],
  );

  const loadCode = useCallback(
    async (code) => {
      const doc = await getCode(code);
      if (doc) {
        setValue('name', doc.name);
      }
    },
    [setValue],
  );

  useEffect(() => {
    if (itemId) {
      loadItem(itemId);
    }
  }, [itemId, loadItem]);

  useEffect(() => {
    if (code) {
      loadCode(code);
    }
  }, [code, loadCode]);

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="p-9 w-full h-full space-y-4">
        <Box className="flex justify-between">
          <IconButton
            className="rounded-[10px] border2d"
            onClick={() => handleBack(itemId || null)}
            sx={{ backgroundColor: 'primary.main', '&:hover, &:active': { backgroundColor: 'primary.main' } }}
          >
            <ArrowBackIosNewIcon className="size-8 text-black" />
          </IconButton>
          <IconButton
            className="rounded-[10px] border2d"
            onClick={() => navigate('/items/scan')}
            sx={{ backgroundColor: 'primary.main', '&:hover, &:active': { backgroundColor: 'primary.main' } }}
          >
            <BarcodeReaderIcon className="size-8 text-black" />
          </IconButton>
        </Box>
        <FormControl className="space-y-2 w-full">
          <FormLabel required className="text-sm text-black">
            名稱
          </FormLabel>
          <Controller
            name="name"
            control={control}
            rules={{ required: '名稱為必填' }}
            render={({ field }) => (
              <Box className="flex items-center">
                <TextField
                  {...field}
                  fullWidth
                  className={errors.name ? 'border2d-error' : 'border2d'}
                  slotProps={{ input: { classes: { notchedOutline: 'border-0' } } }}
                  variant="outlined"
                  error={!!errors.name}
                />
                {errors.name && <CancelOutlinedIcon className="text-[#EC2828] absolute -right-6" />}
              </Box>
            )}
          />
          <FormHelperText>{code || item?.code ? `條碼: ${code || item?.code}` : ''}</FormHelperText>
        </FormControl>

        <FormControl className="space-y-2 w-full">
          <FormLabel required className="text-sm text-black">
            到期日
          </FormLabel>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
            <Controller
              name="date"
              control={control}
              rules={{ required: '請選擇日期', validate: (val) => isValid(val) && isSelectableDate(val) }}
              render={({ field }) => {
                return (
                  <Box className="w-full flex items-center">
                    <DatePicker
                      {...field}
                      className={errors.date ? 'border2d-error w-full' : 'border2d w-full'}
                      shouldDisableDate={(day) => !isSelectableDate(day)}
                      slotProps={{
                        toolbar: { hidden: true },
                        textField: {
                          sx: {
                            '& .MuiPickersSectionList-root': {
                              display: 'flex',
                              justifyContent: 'center',
                            },
                            '& .MuiPickersOutlinedInput-root': {
                              border: 0,
                            },
                            '& .MuiPickersOutlinedInput-root .MuiPickersOutlinedInput-notchedOutline': {
                              border: 0,
                            },
                            '& .MuiPickersOutlinedInput-notchedOutline': {
                              border: 0,
                            },
                            '& span': {
                              fontSize: 24,
                            },
                          },
                        },
                      }}
                      format="yyyy | MM | dd"
                      inputFormat="YYYY-MM-dd"
                      formatDensity="spacious"
                    />
                    {errors.date && <CancelOutlinedIcon className="text-[#EC2828] absolute -right-6" />}
                  </Box>
                );
              }}
            />
          </LocalizationProvider>
        </FormControl>

        <FormControl className="space-y-2 w-full">
          <FormLabel className="text-sm text-black">備註</FormLabel>
          <Controller
            name="note"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                className="border2d"
                multiline
                slotProps={{ input: { classes: { notchedOutline: 'border-0' } } }}
                minRows={10}
                variant="outlined"
              />
            )}
          />
        </FormControl>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          loading={saving}
          loadingPosition="start"
          className="mt-4 border2d text-black text-xl"
        >
          {saving ? '儲存中' : '儲存'}
        </Button>
      </form>
      <AlertDialog open={!isEmpty(alertMessage)} {...alertMessage} />
    </>
  );
};

export default Item;
