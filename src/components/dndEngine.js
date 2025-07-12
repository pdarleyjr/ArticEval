// Drag and Drop Engine for Form Builder

class DndEngine {
  constructor(formBuilder) {
    this.formBuilder = formBuilder;
    this.dropZone = document.getElementById('dropZone');
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-element');

    draggables.forEach((draggable) => {
      draggable.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', draggable.dataset.type);
        draggable.classList.add('dragging');
      });

      draggable.addEventListener('dragend', () => {
        draggable.classList.remove('dragging');
      });
    });

    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.classList.add('drag-over');
    });

    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.classList.remove('drag-over');
    });

    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.classList.remove('drag-over');
      const type = e.dataTransfer.getData('text/plain');
      this.formBuilder.addElement(type);
    });
  }
}

export default DndEngine;
