import { useState } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import usePlansStore from '../../store/usePlansStore'
import useTeamsStore from '../../store/useTeamsStore'
import Button from '../ui/Button'
import EmptyState from '../ui/EmptyState'
import { MessageSquare } from 'lucide-react'

export default function PlanNotesTab({ planId }) {
  const { getPlan, addNote, updateNote, deleteNote } = usePlansStore()
  const { teams } = useTeamsStore()
  const plan = getPlan(planId)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', teamId: '' })

  if (!plan) return null
  const notes = plan.notes || []

  function handleAdd() {
    if (!form.title.trim()) return
    addNote(planId, form)
    setAdding(false)
    setForm({ title: '', content: '', teamId: '' })
  }

  function handleUpdate(noteId) {
    updateNote(planId, noteId, form)
    setEditingId(null)
  }

  function startEdit(note) {
    setForm({ title: note.title, content: note.content, teamId: note.teamId || '' })
    setEditingId(note.id)
  }

  function getTeamName(id) {
    return teams.find((t) => t.id === id)?.name || ''
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Notas del Plan</p>
        <Button size="sm" onClick={() => { setAdding(true); setForm({ title: '', content: '', teamId: '' }) }}>
          <Plus size={13} /> Nueva nota
        </Button>
      </div>

      {(notes.length === 0 && !adding) && (
        <EmptyState icon={MessageSquare} title="Sin notas" description="Agrega notas visibles para el equipo técnico o equipos específicos." />
      )}

      <div className="space-y-3">
        {/* Add form */}
        {adding && (
          <NoteForm
            form={form}
            setForm={setForm}
            teams={teams}
            onSave={handleAdd}
            onCancel={() => setAdding(false)}
          />
        )}

        {/* Existing notes */}
        {notes.map((note) => (
          <div key={note.id} className="bg-white border border-gray-200 rounded-xl p-4">
            {editingId === note.id ? (
              <NoteForm
                form={form}
                setForm={setForm}
                teams={teams}
                onSave={() => handleUpdate(note.id)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{note.title}</p>
                    {note.teamId && (
                      <p className="text-xs text-indigo-600 mt-0.5">{getTeamName(note.teamId)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEdit(note)} className="p-1 text-gray-300 hover:text-indigo-500"><Edit2 size={13} /></button>
                    <button onClick={() => deleteNote(planId, note.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={13} /></button>
                  </div>
                </div>
                <pre className="text-sm text-gray-600 whitespace-pre-wrap font-sans">{note.content}</pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function NoteForm({ form, setForm, teams, onSave, onCancel }) {
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
      <input
        type="text"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        placeholder="Título de la nota (ej: AUDIO/VISUAL)"
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 uppercase"
        autoFocus
      />
      <textarea
        value={form.content}
        onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        placeholder="Contenido de la nota..."
        rows={4}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <select
          value={form.teamId}
          onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Para todos los equipos</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className="flex-1" />
        <Button variant="secondary" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button size="sm" onClick={onSave}>Guardar</Button>
      </div>
    </div>
  )
}
