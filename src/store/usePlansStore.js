import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { plans as seedPlans } from '../data/seed'

function genId() {
  return Math.random().toString(36).slice(2, 10)
}

const usePlansStore = create(
  persist(
    (set, get) => ({
      plans: seedPlans,

      // Plan CRUD
      addPlan: (plan) => set((s) => ({ plans: [...s.plans, { ...plan, id: genId(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), order: [], assignments: [], notes: [], times: [] }] })),
      updatePlan: (id, updates) => set((s) => ({ plans: s.plans.map((p) => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p) })),
      deletePlan: (id) => set((s) => ({ plans: s.plans.filter((p) => p.id !== id) })),
      getPlan: (id) => get().plans.find((p) => p.id === id),

      // Service Times
      addTime: (planId, time) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, times: [...p.times, { ...time, id: genId() }] } : p),
      })),
      updateTime: (planId, timeId, updates) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, times: p.times.map((t) => t.id === timeId ? { ...t, ...updates } : t) } : p),
      })),
      deleteTime: (planId, timeId) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, times: p.times.filter((t) => t.id !== timeId) } : p),
      })),

      // Order Items
      setOrder: (planId, order) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, order, updatedAt: new Date().toISOString() } : p),
      })),
      addOrderItem: (planId, item) => set((s) => {
        const plan = s.plans.find((p) => p.id === planId)
        const maxPos = plan.order.length > 0 ? Math.max(...plan.order.map((o) => o.position)) + 1 : 0
        return {
          plans: s.plans.map((p) => p.id === planId
            ? { ...p, order: [...p.order, { ...item, id: genId(), position: maxPos }], updatedAt: new Date().toISOString() }
            : p),
        }
      }),
      updateOrderItem: (planId, itemId, updates) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId
          ? { ...p, order: p.order.map((o) => o.id === itemId ? { ...o, ...updates } : o), updatedAt: new Date().toISOString() }
          : p),
      })),
      deleteOrderItem: (planId, itemId) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId
          ? { ...p, order: p.order.filter((o) => o.id !== itemId), updatedAt: new Date().toISOString() }
          : p),
      })),
      duplicateOrderItem: (planId, itemId) => set((s) => {
        const plan = s.plans.find((p) => p.id === planId)
        const item = plan.order.find((o) => o.id === itemId)
        const idx = plan.order.indexOf(item)
        const newItem = { ...item, id: genId(), position: item.position + 0.5 }
        const newOrder = [...plan.order]
        newOrder.splice(idx + 1, 0, newItem)
        // re-index positions
        const reindexed = newOrder.map((o, i) => ({ ...o, position: i }))
        return { plans: s.plans.map((p) => p.id === planId ? { ...p, order: reindexed } : p) }
      }),

      // Notes
      addNote: (planId, note) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, notes: [...(p.notes || []), { ...note, id: genId(), createdAt: new Date().toISOString() }] } : p),
      })),
      updateNote: (planId, noteId, updates) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, notes: (p.notes || []).map((n) => n.id === noteId ? { ...n, ...updates } : n) } : p),
      })),
      deleteNote: (planId, noteId) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, notes: (p.notes || []).filter((n) => n.id !== noteId) } : p),
      })),

      // Assignments (volunteer scheduling)
      setAssignment: (planId, assignment) => set((s) => {
        const plan = s.plans.find((p) => p.id === planId)
        const existing = (plan.assignments || []).find(
          (a) => a.timeId === assignment.timeId && a.teamId === assignment.teamId && a.positionId === assignment.positionId && a.personId === assignment.personId
        )
        let newAssignments
        if (existing) {
          newAssignments = plan.assignments.map((a) => a.id === existing.id ? { ...a, ...assignment } : a)
        } else {
          newAssignments = [...(plan.assignments || []), { ...assignment, id: genId() }]
        }
        return { plans: s.plans.map((p) => p.id === planId ? { ...p, assignments: newAssignments } : p) }
      }),
      removeAssignment: (planId, assignmentId) => set((s) => ({
        plans: s.plans.map((p) => p.id === planId ? { ...p, assignments: (p.assignments || []).filter((a) => a.id !== assignmentId) } : p),
      })),
    }),
    { name: 'comunidad-plans' }
  )
)

export default usePlansStore
