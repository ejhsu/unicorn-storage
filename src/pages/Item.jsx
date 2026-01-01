import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import { Box, Button, FormControl, FormHelperText, FormLabel, IconButton, TextField } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { endOfDay, fromUnixTime, getUnixTime, isPast, isValid } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { fromZonedTime } from 'date-fns-tz';
import { isEmpty } from 'lodash-es';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useLocation, useNavigate, useParams } from 'react-router';

import AlertDialog from '../components/AlertDialog';
import { getCode, loadItem as fsLoadItem, setCode, upsertItem } from '../services/item';

const Item = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const { itemId } = useParams();

  const code = location.state?.code || null;

  const [alertMessage, setAlertMessage] = useState(null);
  const [item, setItem] = useState(null);

  const {
    control,
    handleSubmit,
    setError,
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

  const onSubmit = async (data) => {
    const now = new Date();
    const docId = item?.docId || `${now.valueOf()}`;
    const itemCode = code || item?.code || '';
    try {
      await Promise.all([
        upsertItem(docId, {
          docId,
          name: data.name,
          expiry: getUnixTime(fromZonedTime(endOfDay(data.date), 'Asia/Taipei')) * 1000,
          created: item?.created || now.valueOf(),
          updated: now.valueOf(),
          code: itemCode,
        }),
        itemCode ? setCode(itemCode, data.name) : null,
      ]);
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
      setAlertMessage({
        title: '儲存失敗失敗',
        description: JSON.stringify(error),
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
      setItem(data);
      setValue('name', data.name);
      setValue('date', fromUnixTime(data.expiry / 1000));
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
            sx={{ backgroundColor: 'primary.main' }}
          >
            <ArrowBackIosNewIcon className="size-8 text-black" />
          </IconButton>
          <IconButton className="rounded-[10px] border2d" onClick={() => navigate('/items/scan')} sx={{ backgroundColor: 'primary.main' }}>
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
              rules={{ required: '請選擇日期', validate: (val) => isValid(val) && !isPast(val) }}
              render={({ field }) => {
                return (
                  <Box className="w-full flex items-center">
                    <DatePicker
                      {...field}
                      className={errors.date ? 'border2d-error w-full' : 'border2d w-full'}
                      disablePast
                      onError={(newError) => setError('date', newError)}
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

        <Button type="submit" fullWidth variant="contained" color="primary" className="mt-4 border2d text-black text-xl">
          儲存
        </Button>
      </form>
      <AlertDialog open={!isEmpty(alertMessage)} {...alertMessage} />
    </>
  );
};

export default Item;
