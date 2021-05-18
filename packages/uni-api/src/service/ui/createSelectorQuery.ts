import { ComponentPublicInstance } from 'vue'
import { getCurrentPageVm, getPageIdByVm } from '@dcloudio/uni-core'
import { defineSyncApi } from '../../helpers/api'
import { CanvasContext } from '../context/canvas'
import { EditorContext } from '../context/editor'
import { MapContext } from '../context/createMapContext'
import { VideoContext } from '../context/createVideoContext'
import { requestComponentInfo } from '@dcloudio/uni-platform'

type NodeField = UniApp.NodeField
type ContextType = 'canvas' | 'map' | 'video' | 'editor'
interface NodeInfo extends UniApp.NodeInfo {
  contextInfo?: {
    id: string
    type: ContextType
    page: number
  }
}

const ContextClasss = {
  canvas: CanvasContext,
  map: MapContext,
  video: VideoContext,
  editor: EditorContext,
}

function convertContext(result: NodeInfo | null) {
  if (result && result.contextInfo) {
    const { id, type, page } = (result as NodeInfo).contextInfo!
    const ContextClass = ContextClasss[type]
    result.context = new ContextClass(id, page)
    delete result.contextInfo
  }
}

class NodesRef implements UniApp.NodesRef {
  private _selectorQuery: SelectorQuery
  private _component: ComponentPublicInstance | null | undefined
  private _selector: string
  private _single: boolean
  constructor(
    selectorQuery: SelectorQuery,
    component: ComponentPublicInstance | null | undefined,
    selector: string,
    single: boolean
  ) {
    this._selectorQuery = selectorQuery
    this._component = component
    this._selector = selector
    this._single = single
  }

  boundingClientRect(callback: (result: NodeInfo) => void) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        id: true,
        dataset: true,
        rect: true,
        size: true,
      },
      callback
    )
    return this._selectorQuery
  }

  fields(fields: NodeField, callback: (result: NodeInfo) => void) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      fields,
      callback
    )
    return this._selectorQuery
  }

  scrollOffset(callback: (result: NodeInfo) => void) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        id: true,
        dataset: true,
        scrollOffset: true,
      },
      callback
    )
    return this._selectorQuery
  }

  context(callback: (result: NodeInfo) => void) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        context: true,
      },
      callback
    )
    return this._selectorQuery
  }
}

class SelectorQuery implements UniApp.SelectorQuery {
  private _page: ComponentPublicInstance
  private _queue: Array<{
    component: ComponentPublicInstance | undefined | null
    selector: string
    single: boolean
    fields: NodeField
  }>
  private _component?: ComponentPublicInstance = undefined
  private _queueCb: any[]
  private _nodesRef?: NodesRef
  constructor(page: ComponentPublicInstance) {
    this._page = page
    this._queue = []
    this._queueCb = []
  }

  exec(callback?: (result: any) => void) {
    requestComponentInfo(
      this._page,
      this._queue,
      (res: Array<NodeInfo | null>) => {
        const queueCbs = this._queueCb
        res.forEach((result, index) => {
          if (Array.isArray(result)) {
            result.forEach(convertContext)
          } else {
            convertContext(result)
          }
          const queueCb = queueCbs[index]
          if (typeof queueCb === 'function') {
            queueCb.call(this, result)
          }
        })
        // isFn(callback) &&
        if (typeof callback === 'function') {
          callback.call(this, res)
        }
      }
    )
    // TODO
    return this._nodesRef as NodesRef
  }

  in(component?: ComponentPublicInstance) {
    this._component = component || undefined
    return this
  }

  select(selector: string) {
    return (this._nodesRef = new NodesRef(
      this,
      this._component,
      selector,
      true
    ))
  }

  selectAll(selector: string) {
    return (this._nodesRef = new NodesRef(
      this,
      this._component,
      selector,
      false
    ))
  }

  selectViewport() {
    return (this._nodesRef = new NodesRef(this, null, '', true))
  }

  _push(
    selector: string,
    component: ComponentPublicInstance | undefined | null,
    single: boolean,
    fields: NodeField,
    callback: (result: NodeInfo) => void
  ) {
    this._queue.push({
      component,
      selector,
      single,
      fields,
    })
    this._queueCb.push(callback)
  }
}

export const createSelectorQuery = <typeof uni.createSelectorQuery>(
  defineSyncApi('createSelectorQuery', (context?: any) => {
    if (context && !getPageIdByVm(context)) {
      context = null
    }
    return new SelectorQuery(context || getCurrentPageVm()!)
  })
)
