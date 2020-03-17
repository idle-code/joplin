/**
 * Copyright (c) Tiny Technologies, Inc. All rights reserved.
 * Licensed under the LGPL or a commercial license.
 * For LGPL see License.txt in the project root for license information.
 * For commercial licenses see https://www.tiny.cloud/
 */

import Tools from 'tinymce/core/api/util/Tools';
import * as NodeType from '../core/NodeType';
import Editor from 'tinymce/core/api/Editor';
import { isCustomList } from '../core/Util';

const findIndex = function (list, predicate) {
  for (let index = 0; index < list.length; index++) {
    const element = list[index];

    if (predicate(element)) {
      return index;
    }
  }
  return -1;
};

function jp_isCheckboxListItem(element) {
  return element.classList && element.classList.contains('joplinCheckboxList');
}

function jp_findContainerListTypeFromEvent(event) {
  if (jp_isCheckboxListItem(event.element)) return 'joplinCheckboxList';

  for (const parent of event.parents) {
    if (jp_isCheckboxListItem(parent)) return 'joplinCheckboxList';
  }

  return 'regular';
}

// function jp_findContainerListTypeFromElement(element) {
//   while (element) {
//     if (element.nodeName === 'UL' || element.nodName === 'OL') {
//       return jp_isCheckboxListItem(element) ? 'joplinCheckboxList' : 'regular';
//     }
//     element = element.parentNode;
//   }

//   return 'regular';
// }

const listState = function (editor: Editor, listName, options:any = {}) {
  options = {
    listType: 'regular',
    ...options,
  };

  return function (buttonApi) {
    const nodeChangeHandler = (e) => {
      const tableCellIndex = findIndex(e.parents, NodeType.isTableCellNode);
      const parents = tableCellIndex !== -1 ? e.parents.slice(0, tableCellIndex) : e.parents;
      const lists = Tools.grep(parents, NodeType.isListNode);
      const listType = jp_findContainerListTypeFromEvent(e);
      buttonApi.setActive(listType === options.listType && lists.length > 0 && lists[0].nodeName === listName && !isCustomList(lists[0]));
    };

    // const editorClickHandler = (event) => {
    //   const listType = jp_findContainerListTypeFromElement(event.target);
    //   console.info('TYPE', listType);
    // }

    editor.on('NodeChange', nodeChangeHandler);
    // editor.on('click', editorClickHandler);

    return () => {
      editor.off('NodeChange', nodeChangeHandler);
      // editor.off('click', editorClickHandler);
    } 
  };
};

const register = function (editor: Editor) {
  const hasPlugin = function (editor, plugin) {
    const plugins = editor.settings.plugins ? editor.settings.plugins : '';
    return Tools.inArray(plugins.split(/[ ,]/), plugin) !== -1;
  };

  const exec = (command) => () => editor.execCommand(command);

  if (!hasPlugin(editor, 'advlist')) {
    editor.ui.registry.addToggleButton('numlist', {
      icon: 'ordered-list',
      active: false,
      tooltip: 'Numbered list',
      onAction: exec('InsertOrderedList'),
      onSetup: listState(editor, 'OL')
    });

    editor.ui.registry.addToggleButton('bullist', {
      icon: 'unordered-list',
      active: false,
      tooltip: 'Bullet list',
      onAction: exec('InsertUnorderedList'),
      onSetup: listState(editor, 'UL')
    });

    editor.ui.registry.addToggleButton('joplinCheckboxList', {
      icon: 'checklist',
      active: false,
      tooltip: 'Checkbox list',
      onAction: exec('InsertJoplinCheckboxList'),
      onSetup: listState(editor, 'UL', { listType: 'joplinCheckboxList' })
    });
  }
};

export {
  register
};
