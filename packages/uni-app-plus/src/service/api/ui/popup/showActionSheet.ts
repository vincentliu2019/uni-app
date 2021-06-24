import {
  API_TYPE_SHOW_ACTION_SHEET,
  API_SHOW_ACTION_SHEET,
  ShowActionSheetProtocol,
  ShowActionSheetOptions,
  defineAsyncApi,
} from '@dcloudio/uni-api'
import { extend } from '@vue/shared'
import { useI18n } from '@dcloudio/uni-core'

export const showActionSheet = defineAsyncApi<API_TYPE_SHOW_ACTION_SHEET>(
  API_SHOW_ACTION_SHEET,
  (
    {
      itemList = [],
      itemColor = '#000000',
      title = '',
      alertText = '',
      popover,
    },
    { resolve, reject }
  ) => {
    const { t } = useI18n()
    const options = {
      title,
      cancel: t('uni.showActionSheet.cancel'),
      buttons: itemList.map((item) => ({
        title: item,
        color: itemColor,
      })),
    }
    if (title || alertText) {
      options.title = alertText || title
    }
    plus.nativeUI.actionSheet(
      extend(options, {
        popover,
      }),
      (e) => {
        if (e.index > 0) {
          resolve({
            tapIndex: e.index - 1,
          })
        } else {
          reject('showActionSheet:fail cancel')
        }
      }
    )
  },
  ShowActionSheetProtocol,
  ShowActionSheetOptions
)