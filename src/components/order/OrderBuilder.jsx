import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay, useDraggable
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { Plus, Music2, MessageSquare, AlignLeft, Film, Clock, Maximize2, BookCopy } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import OrderItem from './OrderItem'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

// ── helpers ──────────────────────────────────────────────────────────────────

export function fmtDuration(secs) {
  if (!secs || secs <= 0) return '—'
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h > 0) return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  return `${m}:${s.toString().padStart(2,'0')}`
}

export function fmtClockTime(baseMinutes, offsetSecs) {
  if (baseMinutes == null) return null
  const totalMins = baseMinutes + Math.floor(offsetSecs / 60)
  const h24 = Math.floor(totalMins / 60) % 24
  const m   = totalMins % 60
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24
  return `${h12}:${m.toString().padStart(2, '0')}`
}

const isSec = (type) => type === 'header' || type === 'section'

export function buildStartTimes(order) {
  // First pass: find before-service sections and their total durations
  const sectionInfo = {}
  let curSecId = null
  for (const item of order) {
    if (isSec(item.type)) {
      curSecId = item.id
      sectionInfo[item.id] = { beforeService: !!item.beforeService, totalDuration: 0 }
    } else if (curSecId) {
      sectionInfo[curSecId].totalDuration += item.duration || 0
    }
  }

  // Second pass: assign offsets
  // Before-service items get negative offsets counting up to 0 (service start)
  // Regular items get positive offsets from 0
  const map = {}
  curSecId = null
  let beforeOffset = 0
  let afterOffset  = 0
  for (const item of order) {
    if (isSec(item.type)) {
      curSecId = item.id
      if (sectionInfo[item.id]?.beforeService) {
        beforeOffset = -(sectionInfo[item.id].totalDuration)
      }
    } else {
      if (curSecId && sectionInfo[curSecId]?.beforeService) {
        map[item.id] = beforeOffset
        beforeOffset += item.duration || 0
      } else {
        map[item.id] = afterOffset
        afterOffset  += item.duration || 0
      }
    }
  }
  return map
}

function totalSeconds(order) {
  return order.filter(i => !isSec(i.type)).reduce((s, i) => s + (i.duration || 0), 0)
}

export function buildSectionTotals(order) {
  const map = {}
  let currentHeaderId = null
  let running = 0
  for (const item of order) {
    if (isSec(item.type)) {
      if (currentHeaderId) map[currentHeaderId] = running
      currentHeaderId = item.id
      running = 0
    } else {
      running += item.duration || 0
    }
  }
  if (currentHeaderId) map[currentHeaderId] = running
  return map
}

// ── item type menu ────────────────────────────────────────────────────────────

const ITEM_TYPES = [
  { type: 'header',  label: 'Encabezado',      icon: AlignLeft,     color: 'text-gray-500',    bg: 'hover:bg-gray-50',    desc: 'Separador de sección' },
  { type: 'song',    label: 'Canción',          icon: Music2,        color: 'text-indigo-600',  bg: 'hover:bg-indigo-50',  desc: 'Del repertorio' },
  { type: 'spoken',  label: 'Elemento Hablado', icon: MessageSquare, color: 'text-emerald-600', bg: 'hover:bg-emerald-50', desc: 'Bienvenida, mensaje…' },
  { type: 'media',   label: 'Media / Video',    icon: Film,          color: 'text-orange-500',  bg: 'hover:bg-orange-50',  desc: 'Video o enlace' },
]

// ── main component ────────────────────────────────────────────────────────────

export default function OrderBuilder({ planId }) {
  const navigate = useNavigate()
  const { getPlan, setOrder, addOrderItem, deleteOrderItem, duplicateOrderItem, saveAsTemplate } = usePlansStore()
  const plan = getPlan(planId)

  const [addMenuOpen,       setAddMenuOpen]       = useState(false)
  const [insertAfter,       setInsertAfter]       = useState(null)
  const [activeId,          setActiveId]          = useState(null)
  const [draggingNewType,   setDraggingNewType]   = useState(null)
  const [selectedTime,      setSelectedTime]      = useState(null)
  const [saveTemplateOpen,  setSaveTemplateOpen]  = useState(false)
  const [templateName,      setTemplateName]      = useState('')
  const addBtnRef = useRef()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  if (!plan) return null

  const order       = [...(plan.order || [])].sort((a, b) => a.position - b.position)
  const startTimes  = buildStartTimes(order)
  const sectionTots = buildSectionTotals(order)
  const total       = totalSeconds(order)

  // service start time in minutes from midnight
  const allTimes     = (plan.times || []).filter(t => !t.isRehearsal)
  const currentTime  = allTimes.find(t => t.id === selectedTime) || allTimes[0] || null
  let baseMinutes    = null
  if (currentTime?.datetime) {
    const d = new Date(currentTime.datetime)
    baseMinutes = d.getHours() * 60 + d.getMinutes()
  }

  const anyDragging = activeId !== null || draggingNewType !== null

  // ── drag ──
  function handleDragStart({ active }) {
    if (active.data.current?.isNew) {
      setDraggingNewType(active.data.current.itemType)
    } else {
      setActiveId(active.id)
    }
  }

  function handleDragEnd({ active, over }) {
    if (active.data.current?.isNew) {
      setDraggingNewType(null)
      setAddMenuOpen(false)
      setInsertAfter(null)
      if (over) handleAddItem(active.data.current.itemType, over.id)
      return
    }
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIdx = order.findIndex(i => i.id === active.id)
    const newIdx = order.findIndex(i => i.id === over.id)
    const reordered = arrayMove(order, oldIdx, newIdx).map((item, idx) => ({ ...item, position: idx }))
    setOrder(planId, reordered)
  }

  // ── add item ──
  function handleAddItem(type, afterId) {
    const DEFAULTS = {
      header:  { title: 'NUEVA SECCIÓN', duration: 0    },
      song:    { title: '',              duration: 240   },
      spoken:  { title: '',              duration: 300   },
      media:   { title: '',              duration: 180   },
    }
    if (afterId != null) {
      const afterIdx = afterId === 'start' ? -1 : order.findIndex(i => i.id === afterId)
      const newItem = { type, ...DEFAULTS[type], id: Math.random().toString(36).slice(2, 10), position: afterIdx + 1 }
      const newOrder = [
        ...order.slice(0, afterIdx + 1),
        newItem,
        ...order.slice(afterIdx + 1),
      ].map((item, idx) => ({ ...item, position: idx }))
      setOrder(planId, newOrder)
    } else {
      addOrderItem(planId, { type, ...DEFAULTS[type] })
    }
    setAddMenuOpen(false)
    setInsertAfter(null)
  }

  const activeItem = activeId ? order.find(i => i.id === activeId) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={draggingNewType ? [] : [restrictToVerticalAxis]}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── sticky toolbar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-3 md:px-6 py-2 flex flex-wrap items-center gap-2 md:gap-4">
        {/* Duration */}
        <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 min-w-0">
          <Clock size={13} className="flex-shrink-0" />
          <strong className="text-gray-800">{fmtDuration(total)}</strong>
          <span className="text-gray-300">·</span>
          <span className="text-gray-400">{order.length} elem.</span>
        </div>

        {/* Service time clock selector — scrollable */}
        {allTimes.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto flex-shrink-0 max-w-[180px] md:max-w-none">
            {allTimes.map(t => (
              <button
                key={t.id}
                onClick={() => setSelectedTime(t.id === selectedTime ? null : t.id)}
                className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap transition-colors flex-shrink-0 ${
                  (selectedTime === t.id || (!selectedTime && t.id === allTimes[0]?.id))
                    ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Icon buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => { setTemplateName(''); setSaveTemplateOpen(true) }}
            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Guardar como plantilla"
          >
            <BookCopy size={15} />
          </button>
          <button
            onClick={() => navigate(`/eventos/${planId}/vista`)}
            className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
            title="Vista completa / imprimir"
          >
            <Maximize2 size={15} />
          </button>
        </div>

        {/* Add button */}
        <div className="relative flex-shrink-0" ref={addBtnRef}>
          <Button size="sm" onClick={() => setAddMenuOpen(v => !v)}>
            <Plus size={14} /> Agregar
          </Button>
          {addMenuOpen && (
            <AddMenu
              onSelect={type => handleAddItem(type, null)}
              onClose={() => setAddMenuOpen(false)}
            />
          )}
        </div>
      </div>

      {/* ── column headers ── */}
      {order.length > 0 && (
        <div className="flex items-center border-b border-gray-200 bg-white px-0 py-1.5 flex-shrink-0">
          <div className="w-7 flex-shrink-0" />
          <div className="w-[52px] flex-shrink-0 text-right pr-3">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Hora</span>
          </div>
          <div className="w-[52px] flex-shrink-0 text-right pr-4">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dur.</span>
          </div>
          <div className="flex-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Título</span>
          </div>
        </div>
      )}

      {/* ── list ── */}
      <div className="flex-1 overflow-y-auto">
        {order.length === 0 ? (
          <EmptyOrder onAdd={type => handleAddItem(type, null)} />
        ) : (
          <>
            {/* Insert at very top */}
            <InsertRow
              onAdd={type => handleAddItem(type, 'start')}
              insertAfter={insertAfter}
              id="start"
              setInsertAfter={setInsertAfter}
            />

            <SortableContext items={order.map(i => i.id)} strategy={verticalListSortingStrategy}>
              {order.map((item) => (
                <div key={item.id}>
                  <OrderItem
                    item={item}
                    planId={planId}
                    startSeconds={startTimes[item.id]}
                    baseMinutes={baseMinutes}
                    sectionTotal={sectionTots[item.id]}
                    onDelete={() => deleteOrderItem(planId, item.id)}
                    onDuplicate={() => duplicateOrderItem(planId, item.id)}
                  />
                  <InsertRow
                    id={item.id}
                    insertAfter={insertAfter}
                    setInsertAfter={setInsertAfter}
                    onAdd={type => handleAddItem(type, item.id)}
                  />
                </div>
              ))}
            </SortableContext>
          </>
        )}
      </div>

      {/* click-outside closes add menu — suppressed during drag so menu stays open */}
      {addMenuOpen && !anyDragging && (
        <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />
      )}

      <DragOverlay>
        {draggingNewType ? (
          <NewItemDragPreview type={draggingNewType} />
        ) : activeItem ? (
          <OrderItem
            item={activeItem}
            planId={planId}
            startSeconds={startTimes[activeItem.id]}
            baseMinutes={baseMinutes}
            isDragging
          />
        ) : null}
      </DragOverlay>

      {/* Save as template modal */}
      <Modal open={saveTemplateOpen} onClose={() => setSaveTemplateOpen(false)} title="Guardar como plantilla">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            La plantilla guardará el orden de {order.length} elemento{order.length !== 1 ? 's' : ''}.
            Podrás aplicarla al crear nuevos eventos.
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Nombre de la plantilla</label>
            <input
              autoFocus
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && templateName.trim()) {
                  saveAsTemplate(planId, templateName.trim())
                  setSaveTemplateOpen(false)
                }
              }}
              placeholder="ej: Servicio Dominical Estándar"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setSaveTemplateOpen(false)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (templateName.trim()) {
                  saveAsTemplate(planId, templateName.trim())
                  setSaveTemplateOpen(false)
                }
              }}
              disabled={!templateName.trim()}
            >
              Guardar plantilla
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </DndContext>
  )
}

// ── AddMenu ───────────────────────────────────────────────────────────────────

function AddMenu({ onSelect }) {
  return (
    <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden">
      {ITEM_TYPES.map((cfg) => (
        <DraggableMenuItem key={cfg.type} {...cfg} onSelect={onSelect} />
      ))}
    </div>
  )
}

function DraggableMenuItem({ type, label, icon: Icon, color, bg, desc, onSelect }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: { isNew: true, itemType: type },
  })
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onSelect(type)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-grab active:cursor-grabbing select-none ${bg} ${isDragging ? 'opacity-40' : ''}`}
    >
      <Icon size={16} className={`${color} flex-shrink-0`} />
      <div>
        <p className="text-sm font-semibold text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{desc}</p>
      </div>
    </div>
  )
}

function NewItemDragPreview({ type }) {
  const cfg = ITEM_TYPES.find(t => t.type === type)
  if (!cfg) return null
  const Icon = cfg.icon
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-xl text-sm font-semibold pointer-events-none ${cfg.color}`}>
      <Icon size={14} />
      {cfg.label}
    </div>
  )
}

// ── InsertRow (thin + button between items) ───────────────────────────────────

function InsertRow({ id, insertAfter, setInsertAfter, onAdd }) {
  const open = insertAfter === id
  return (
    <div className="relative h-4 group flex items-center">
      {open ? (
        <div className="w-full flex items-center gap-1 py-0.5">
          {ITEM_TYPES.map(({ type, label, icon: Icon, color, bg }) => (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border border-gray-200 bg-white shadow-sm hover:shadow transition-all ${color}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
          <button
            onClick={() => setInsertAfter(null)}
            className="ml-auto text-xs text-gray-300 hover:text-gray-500 px-1"
          >✕</button>
        </div>
      ) : (
        <button
          onClick={() => setInsertAfter(id)}
          className="absolute left-0 right-0 h-4 flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <div className="flex-1 h-px bg-indigo-200" />
          <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center flex-shrink-0 shadow">
            <Plus size={11} />
          </div>
          <div className="flex-1 h-px bg-indigo-200" />
        </button>
      )}
    </div>
  )
}

// ── EmptyOrder ────────────────────────────────────────────────────────────────

function EmptyOrder({ onAdd }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlignLeft size={24} className="text-gray-300" />
      </div>
      <p className="text-sm font-semibold text-gray-600 mb-1">El orden está vacío</p>
      <p className="text-xs text-gray-400 max-w-xs">
        Agrega canciones, elementos hablados y secciones para construir el programa del servicio.
      </p>
      <div className="flex gap-2 mt-5 flex-wrap justify-center">
        {ITEM_TYPES.map(({ type, label, icon: Icon, color }) => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <Icon size={14} className={color} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
