// ElementTypeDialog.stories.js
import { ElementTypeDialog } from '../components/dialogs/ElementTypeDialog';
import './stories.css';

export default {
  title: 'FormBuilder/Dialogs/ElementTypeDialog',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 20px;';
    
    const button = document.createElement('button');
    button.textContent = args.buttonText || 'Add New Element';
    button.style.cssText = `
      padding: 10px 20px;
      background: #2196F3;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    `;
    
    const resultDiv = document.createElement('div');
    resultDiv.style.cssText = 'margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;';
    resultDiv.textContent = 'Click the button to open the element type dialog';
    
    const elementTypeDialog = new ElementTypeDialog((selectedType) => {
      resultDiv.innerHTML = `<strong>Selected Type:</strong> ${selectedType}`;
      if (args.onSelect) args.onSelect(selectedType);
    });
    
    button.addEventListener('click', () => {
      elementTypeDialog.show();
    });
    
    container.appendChild(button);
    container.appendChild(resultDiv);
    
    // If showCategories is true, also display the available element types
    if (args.showCategories) {
      const categoriesDiv = document.createElement('div');
      categoriesDiv.style.cssText = 'margin-top: 30px; padding: 20px; background: #fff; border: 1px solid #ddd; border-radius: 4px;';
      
      const title = document.createElement('h3');
      title.textContent = 'Available Element Types:';
      categoriesDiv.appendChild(title);
      
      const elementTypes = elementTypeDialog.getElementTypes();
      const categories = {
        basic: 'Basic Elements',
        advanced: 'Advanced Elements',
        display: 'Display Elements',
        containers: 'Container Elements'
      };
      
      Object.entries(categories).forEach(([category, label]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.cssText = 'margin: 10px 0;';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = label;
        categoryTitle.style.cssText = 'margin: 10px 0; color: #666;';
        categoryDiv.appendChild(categoryTitle);
        
        const elements = elementTypes.filter(el => el.category === category);
        const elementsGrid = document.createElement('div');
        elementsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;';
        
        elements.forEach(element => {
          const elementCard = document.createElement('div');
          elementCard.style.cssText = `
            padding: 10px;
            background: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 4px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          `;
          elementCard.innerHTML = `
            <div style="font-size: 24px; margin-bottom: 5px;">${element.icon}</div>
            <div style="font-size: 12px; font-weight: bold;">${element.label}</div>
            <div style="font-size: 10px; color: #999; margin-top: 2px;">${element.type}</div>
          `;
          
          elementCard.addEventListener('mouseenter', () => {
            elementCard.style.background = '#e3f2fd';
            elementCard.style.borderColor = '#2196F3';
          });
          
          elementCard.addEventListener('mouseleave', () => {
            elementCard.style.background = '#f9f9f9';
            elementCard.style.borderColor = '#eee';
          });
          
          elementCard.addEventListener('click', () => {
            resultDiv.innerHTML = `<strong>Clicked on:</strong> ${element.label} (${element.type})`;
          });
          
          elementsGrid.appendChild(elementCard);
        });
        
        categoryDiv.appendChild(elementsGrid);
        categoriesDiv.appendChild(categoryDiv);
      });
      
      container.appendChild(categoriesDiv);
    }
    
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Text for the trigger button'
    },
    onSelect: {
      action: 'selected',
      description: 'Callback when element type is selected'
    },
    showCategories: {
      control: 'boolean',
      description: 'Show available element types below'
    }
  }
};

export const Default = {
  args: {
    buttonText: 'Add New Element'
  }
};

export const WithCategoriesPreview = {
  args: {
    buttonText: 'Choose Element Type',
    showCategories: true
  }
};

export const CustomButtonText = {
  args: {
    buttonText: '➕ Insert Question'
  }
};

export const AddFormElement = {
  args: {
    buttonText: 'Add Form Element',
    onSelect: (type) => {
      console.log('Creating new element of type:', type);
    }
  }
};

export const QuickAdd = {
  args: {
    buttonText: '⚡ Quick Add',
    showCategories: false
  }
};