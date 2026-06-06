import { describe, it, expect, beforeEach } from 'vitest';
import { useEditorStore, type NewTextInput } from './editorStore';
import { BLACK } from '@/types/edits';

const input: NewTextInput = {
  pageIndex: 0,
  x: 10,
  y: 20,
  fontSize: 16,
  color: BLACK,
  fontFamily: 'Helvetica',
};

function reset() {
  useEditorStore.setState({
    edits: [],
    past: [],
    future: [],
    selectedId: null,
  });
}

describe('editorStore undo/redo', () => {
  beforeEach(reset);

  it('adds text and selects it', () => {
    const id = useEditorStore.getState().addText(input);
    const { edits, selectedId } = useEditorStore.getState();
    expect(edits).toHaveLength(1);
    expect(edits[0].text).toBe('Text');
    expect(selectedId).toBe(id);
  });

  it('does not mutate previous snapshots (immutability)', () => {
    const store = useEditorStore.getState();
    const id = store.addText(input);
    const snapshotBefore = useEditorStore.getState().edits;
    store.updateEdit(id, { text: 'Changed' });
    const snapshotAfter = useEditorStore.getState().edits;
    expect(snapshotBefore).not.toBe(snapshotAfter);
    expect(snapshotBefore[0].text).toBe('Text');
    expect(snapshotAfter[0].text).toBe('Changed');
  });

  it('undoes and redoes an add', () => {
    const store = useEditorStore.getState();
    store.addText(input);
    expect(useEditorStore.getState().edits).toHaveLength(1);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().edits).toHaveLength(0);

    useEditorStore.getState().redo();
    expect(useEditorStore.getState().edits).toHaveLength(1);
  });

  it('undo is a no-op with empty history', () => {
    useEditorStore.getState().undo();
    expect(useEditorStore.getState().edits).toHaveLength(0);
  });

  it('clears all with a single undo step', () => {
    const store = useEditorStore.getState();
    store.addText(input);
    store.addText({ ...input, x: 50 });
    expect(useEditorStore.getState().edits).toHaveLength(2);

    useEditorStore.getState().clearAll();
    expect(useEditorStore.getState().edits).toHaveLength(0);

    useEditorStore.getState().undo();
    expect(useEditorStore.getState().edits).toHaveLength(2);
  });

  it('removes an edit and clears its selection', () => {
    const id = useEditorStore.getState().addText(input);
    useEditorStore.getState().removeEdit(id);
    expect(useEditorStore.getState().edits).toHaveLength(0);
    expect(useEditorStore.getState().selectedId).toBeNull();
  });
});
