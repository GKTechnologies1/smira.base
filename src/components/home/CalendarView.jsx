import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, addDays, startOfWeek, parseISO, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalendarView() {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });
  const { data: messages = [] } = useQuery({
    queryKey: ['future-messages'],
    queryFn: () => base44.entities.FutureMessage.list('-created_date', 100),
  });

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getItemsForDay = (day) => {
    const taskItems = tasks
      .filter(t => t.due_date && isSameDay(parseISO(t.due_date), day))
      .map(t => ({ ...t, _kind: 'task' }));
    const msgItems = messages
      .filter(m => m.delivery_date && isSameDay(parseISO(m.delivery_date), day))
      .map(m => ({ ...m, _kind: 'message' }));
    return [...taskItems, ...msgItems];
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const targetDayIndex = parseInt(result.destination.droppableId);
    const newDate = format(days[targetDayIndex], 'yyyy-MM-dd');
    await base44.entities.Task.update(taskId, { due_date: newDate });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Weekly Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setWeekStart(d => addDays(d, -7))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-medium">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
          <button onClick={() => setWeekStart(d => addDays(d, 7))} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-7 gap-1.5">
          {days.map((day, idx) => {
            const isToday = isSameDay(day, new Date());
            const items = getItemsForDay(day);
            return (
              <div key={idx} className="flex flex-col">
                <div className={cn(
                  "text-center py-1.5 rounded-lg mb-1",
                  isToday ? "bg-primary text-primary-foreground" : "bg-secondary"
                )}>
                  <p className="text-xs font-semibold">{format(day, 'EEE')}</p>
                  <p className={cn("text-sm font-bold", isToday ? "" : "text-foreground")}>{format(day, 'd')}</p>
                </div>
                <Droppable droppableId={String(idx)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "min-h-[80px] rounded-xl p-1 flex flex-col gap-1 transition-colors",
                        snapshot.isDraggingOver ? "bg-primary/10 border border-primary/30" : "bg-secondary/50"
                      )}
                    >
                      {items.map((item, i) => (
                        item._kind === 'task' ? (
                          <Draggable key={item.id} draggableId={item.id} index={i}>
                            {(prov, snap) => (
                              <div
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className={cn(
                                  "text-xs rounded-lg p-1.5 cursor-grab active:cursor-grabbing select-none",
                                  snap.isDragging ? "shadow-lg rotate-1" : "",
                                  item.status === 'completed' ? "bg-primary/10 text-primary line-through opacity-60" : "bg-card border border-border"
                                )}
                              >
                                <div className="flex items-center gap-1">
                                  <CheckSquare className="w-2.5 h-2.5 flex-shrink-0 text-primary" />
                                  <span className="line-clamp-2 leading-tight">{item.title}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ) : (
                          <div key={item.id} className="text-xs rounded-lg p-1.5 bg-accent/20 border border-accent/30">
                            <div className="flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 flex-shrink-0 text-accent-foreground" />
                              <span className="line-clamp-2 leading-tight">{item.title || `To ${item.recipient_name}`}</span>
                            </div>
                          </div>
                        )
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}