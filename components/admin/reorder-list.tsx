'use client';

import * as React from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { PpaIcon } from '@/components/ui/ppa-icon';
import { NeuButton } from '@/components/ui/neu-button';
import { ClayBadge } from '@/components/ui/clay-badge';
import { PpaToastContainer, usePpaToast } from '@/components/ui/ppa-toast';

export interface ReorderItem {
  id: string;
  title_id: string;
  categoryName: string;
  order: number;
  icon: string;
}

interface ReorderListProps {
  items: ReorderItem[];
  onSave: (updatedItems: ReorderItem[]) => Promise<void>;
}

export function ReorderList({ items, onSave }: ReorderListProps) {
  const { toasts, addToast, dismissToast } = usePpaToast();
  const [itemList, setItemList] = React.useState<ReorderItem[]>(items);
  const [isSaving, setIsSaving] = React.useState(false);
  const [hasChanged, setHasChanged] = React.useState(false);

  React.useEffect(() => {
    setItemList(items);
  }, [items]);

  const handleOnDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reordered = Array.from(itemList);
    const [reorderedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, reorderedItem);

    // Recalculate order values
    const updated = reordered.map((item, idx) => ({
      ...item,
      order: idx,
    }));

    setItemList(updated);
    setHasChanged(true);
  };

  const handleSaveOrder = async () => {
    setIsSaving(true);
    try {
      await onSave(itemList);
      setHasChanged(false);
      addToast('success', 'Urutan Link Berhasil Disimpan!', 'Posisi penayangan link di halaman publik telah diperbarui.');
    } catch (error) {
      console.error(error);
      addToast('error', 'Gagal Menyimpan Urutan', 'Terjadi kesalahan sistem.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Toast Alert Stack */}
      <PpaToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-[var(--text-main)] flex items-center gap-2">
          <PpaIcon name="grip-vertical" size={16} className="text-[#FF6500]" />
          <span>Seret & Lepas (Drag & Drop) untuk Mengubah Urutan Link</span>
        </h3>

        {hasChanged && (
          <NeuButton
            variant="safety"
            size="sm"
            onClick={handleSaveOrder}
            disabled={isSaving}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Urutan Baru'}
          </NeuButton>
        )}
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="links-droppable">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {itemList.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                        snapshot.isDragging
                          ? 'bg-[#1E3E62] text-white border-[#FF6500] shadow-2xl scale-[1.02]'
                          : 'bg-[var(--bg-secondary)] border-[var(--border-color)]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          {...provided.dragHandleProps}
                          className="text-[var(--text-muted)] hover:text-[#FF6500] cursor-grab active:cursor-grabbing p-1"
                        >
                          <PpaIcon name="grip-vertical" size={18} />
                        </div>
                        <PpaIcon name={item.icon} size={16} className="text-[#FF6500]" />
                        <span className="font-semibold text-xs text-[var(--text-main)] truncate">
                          {item.title_id}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <ClayBadge variant="navy" className="text-[10px] lowercase font-normal">
                          {item.categoryName}
                        </ClayBadge>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono">
                          #{index + 1}
                        </span>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}
