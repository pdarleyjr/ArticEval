// EditDialog.stories.js
import { EditDialog } from '../components/dialogs/EditDialog';
import './stories.css';

// Mock element data
const mockElement = {
  type: 'text',
  name: 'question1',
  title: 'What is your name?',
  description: 'Please enter your full name',
  isRequired: true,
  placeHolder: 'John Doe',
  validators: [{ type: 'text', minLength: 2, maxLength: 50 }]
};

const mockRadioElement = {
  type: 'radiogroup',
  name: 'question2',
  title: 'What is your favorite color?',
  description: 'Choose one option',
  choices: [
    { value: 'red', text: 'Red' },
    { value: 'blue', text: 'Blue' },
    { value: 'green', text: 'Green' }
  ],
  isRequired: false
};

const mockMatrixElement = {
  type: 'matrix',
  name: 'question3',
  title: 'Rate the following features',
  columns: [
    { value: '1', text: 'Poor' },
    { value: '2', text: 'Fair' },
    { value: '3', text: 'Good' },
    { value: '4', text: 'Excellent' }
  ],
  rows: [
    { value: 'ease', text: 'Ease of use' },
    { value: 'performance', text: 'Performance' },
    { value: 'features', text: 'Features' }
  ]
};

export default {
  title: 'FormBuilder/Dialogs/EditDialog',
  tags: ['autodocs'],
  render: (args) => {
    const container = document.createElement('div');
    container.style.cssText = 'padding: 20px;';

    const button = document.createElement('button');
    button.textContent = args.buttonText || 'Edit Question';
    button.style.cssText = `
      padding: 10px 20px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    `;

    const resultDiv = document.createElement('div');
    resultDiv.style.cssText =
      'margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;';
    resultDiv.textContent = 'Click the button to open the edit dialog';

    const editDialog = new EditDialog({
      onSave: (updatedElement) => {
        resultDiv.innerHTML = `<strong>Saved:</strong><pre>${JSON.stringify(updatedElement, null, 2)}</pre>`;
        if (args.onSave) {
          args.onSave(updatedElement);
        }
      },
      onDelete: () => {
        resultDiv.innerHTML = '<strong>Element deleted!</strong>';
        if (args.onDelete) {
          args.onDelete();
        }
      }
    });

    button.addEventListener('click', () => {
      editDialog.show(args.element || mockElement);
    });

    container.appendChild(button);
    container.appendChild(resultDiv);

    return container;
  },
  argTypes: {
    element: {
      control: 'object',
      description: 'The element to edit'
    },
    buttonText: {
      control: 'text',
      description: 'Text for the trigger button'
    },
    onSave: {
      action: 'saved',
      description: 'Callback when element is saved'
    },
    onDelete: {
      action: 'deleted',
      description: 'Callback when element is deleted'
    }
  }
};

export const TextQuestion = {
  args: {
    element: mockElement,
    buttonText: 'Edit Text Question'
  }
};

export const RadioQuestion = {
  args: {
    element: mockRadioElement,
    buttonText: 'Edit Radio Question'
  }
};

export const MatrixQuestion = {
  args: {
    element: mockMatrixElement,
    buttonText: 'Edit Matrix Question'
  }
};

export const EmptyQuestion = {
  args: {
    element: {
      type: 'text',
      name: 'newQuestion',
      title: '',
      description: ''
    },
    buttonText: 'Edit New Question'
  }
};

export const RequiredQuestion = {
  args: {
    element: {
      type: 'dropdown',
      name: 'country',
      title: 'Select your country',
      description: 'This field is required',
      isRequired: true,
      choices: ['United States', 'Canada', 'United Kingdom', 'Australia', 'Other'],
      hasOther: true
    },
    buttonText: 'Edit Required Dropdown'
  }
};

export const WithValidation = {
  args: {
    element: {
      type: 'text',
      name: 'email',
      title: 'Email Address',
      inputType: 'email',
      validators: [
        {
          type: 'email',
          text: 'Please enter a valid email'
        },
        {
          type: 'regex',
          regex: '^[a-zA-Z0-9._%+-]+@company\\.com$',
          text: 'Must be a company email'
        }
      ]
    },
    buttonText: 'Edit Email Field'
  }
};
