import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay
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
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m >= 60) {
    const h = Math.floor(m / 60); const r = m % 60
    return r > 0 ? `${h}h ${r}m` : `${h}h`
  }
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m} min`
}

export function fmtClockTime(baseMinutes, offsetSecs) {
  // baseMinutes = service start in minutes from midnight (e.g. 17*60 = 1020 for 5pm)
  if (baseMinutes == null) return null
  const totalMins = baseMinutes + Math.floor(offsetSecs / 60)
  const h = Math.floor(totalMins / 60) % 24
  const m = totalMins % 60
  const ampm = h >= 12 ? 'pm' : 'am'
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
}

function buildStartTimes(order) {
  const map = {}
  let running = 0
  for (const item of order) {
    if (item.type !== 'header') {
      map[item.id] = running
      running += item.duration || 0
    }
  }
  return map
}

function totalSeconds(order) {
  return order.filter(i => i.type !== 'header').reduce((s, i) => s + (i.duration || 0), 0)
}

// Build section subtotals: for each header, sum durations of items until the next header
function buildSectionTotals(order) {
  const map = {}
  let currentHeaderId = null
  let running = 0
  for (const item of order) {
    if (item.type === 'header') {
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

  // ── drag ──
  function handleDragStart({ active }) { setActiveId(active.id) }
  function handleDragEnd({ active, over }) {
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
      song:    { title: '',              duration: 240   },  // blank title → triggers song picker immediately
      spoken:  { title: '',              duration: 300   },  // blank → triggers inline editing
      media:   { title: '',              duration: 180   },
    }
    if (afterId != null) {
      // Insert at position right after afterId
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
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── sticky toolbar ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-6 py-2 flex items-center gap-4">
        {/* Duration */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
          <Clock size={14} className="flex-shrink-0" />
          <span>
            Duración: <strong className="text-gray-800">{fmtDuration(total)}</strong>
          </span>
          <span className="text-gray-200 mx-1">|</span>
          <span className="text-gray-400">{order.length} elemento{order.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Service time clock selector */}
        {allTimes.length > 0 && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-gray-400">Reloj desde:</span>
            <div className="flex gap-1">
              {allTimes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTime(t.id === selectedTime ? null : t.id)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    (selectedTime === t.id || (!selectedTime && t.id === allTimes[0]?.id))
                      ? 'bg-indigo-100 border-indigo-300 text-indigo-700 font-medium'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1" />

        {/* Save as template */}
        <button
          onClick={() => { setTemplateName(''); setSaveTemplateOpen(true) }}
          className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Guardar como plantilla"
        >
          <BookCopy size={15} />
        </button>

        {/* Fullscreen / view button */}
        <button
          onClick={() => navigate(`/eventos/${planId}/vista`)}
          className="p-1.5 rounded text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          title="Vista completa / imprimir"
        >
          <Maximize2 size={15} />
        </button>

        {/* Add button */}
        <div className="relative" ref={addBtnRef}>
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

      {/* ── list ── */}
      <div className="flex-1 overflow-y-auto px-6 py-3">
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

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              modifiers={[restrictToVerticalAxis]}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
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
              <DragOverlay>
                {activeItem && (
                  <OrderItem
                    item={activeItem}
                    planId={planId}
                    startSeconds={startTimes[activeItem.id]}
                    baseMinutes={baseMinutes}
                    isDragging
                  />
                )}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* click-outside closes add menu */}
      {addMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setAddMenuOpen(false)} />}

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
  )
}

// ── AddMenu ───────────────────────────────────────────────────────────────────

function AddMenu({ onSelect, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1.5 overflow-hidden">
      {ITEM_TYPES.map(({ type, label, icon: Icon, color, bg, desc }) => (
        <button
          key={type}
          onClick={() => { onSelect(type); onClose() }}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${bg}`}
        >
          <Icon size={16} className={color} />
          <div>
            <p className="text-sm font-semibold text-gray-800">{label}</p>
            <p className="text-xs text-gray-400">{desc}</p>
          </div>
        </button>
      ))}
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
