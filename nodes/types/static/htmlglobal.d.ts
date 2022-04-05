/** --- Type Defs ---
 * @typedef {import('./../types/typedefs.js').runtimeRED} runtimeRED
 * @typedef {import('jquery')} $
 */
/************************************************************************/
/**
 * get selection firlds
 * @returns {Object} Object for selection fields
 */
declare function getSelectFields(): any;
/**
 * check types of deprecate values
 * @param {*} type type to check
 * @param {*} value value to check
 * @returns original value or replaced one
 */
declare function checkDeprecatedValues(type: any, value: any): any;
/**
 * get types for typeInputs
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {function} getConfig - function to get configuration
 * @returns {Object} object of types
 */
declare function getTypes(node: any, getConfig: Function): any;
/**
 * get auto complete formats
 * @returns {Object} object of auto complete formats
 */
declare function getAutocompleteFormats(): any;
/**
 *initializes a value
 * @param {*} data - object containing property
 * @param {string} id - id of the property
 * @param {*} newVal returns the new value
 */
declare function initializeValue(data: any, id: string, newVal: any): void;
/**
 * initializes an inputbos with autocomplete
 * @param {JQuery<HTMLElement>} $inputBox - jsQuery selector of the input box
 * @param {string} dataListID - id of the datalist from getAutocompleteFormats()
 */
declare function autocomplete($inputBox: JQuery<HTMLElement>, dataListID: string): void;
/**
 * append options to a select field
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {JQuery<HTMLElement>} parent - jQuery selector of the parent element (<select> - field)
 * @param {string} elementName - name of the element from getSelectFields()
 * @param {Function} [filter] - function for filter the elements
 */
declare function appendOptions(node: any, parent: JQuery<HTMLElement>, elementName: string, filter?: Function): void;
/**
* @typedef {Object} typesArr
* @property {string} value - the value property
* @property {string} type - the type property
*/
/**
* @typedef {Object} tiData
* @property {string} valueProp - the name of the value property
* @property {string} typeProp - the name of the type property
* @property {Array.<string|typesArr>} [types] - list of allowed types
* @property {string} [defaultValue] - value for the default value
* @property {string} [defaultType] - value for the default type
* @property {string} [tooltip] - a tootlip for the input field
* @property {string} [width] - width of the input field
* @property {string} [onChange] - on change function
* @property {string} [onFocus] - on focus / focus lost function
*/
/**
 * setup a typedInput for node-red
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {tiData} data - data of the typed input
 * @returns {JQuery<HTMLElement>} jQuery selector of the typeInput field - ideal for chaining
 */
declare function setupTInput(node: any, data: tiData): JQuery<HTMLElement>;
/**
 * set Data for typed input
 * @param {*} $field Typed input field
 * @param {*} value value to set
 * @param {*} type type to set
 */
declare function setTInputValue($field: any, value: any, type: any): void;
/**
 * sets a checkbox matrix
 * @param {string} element name of the element as jQuery element name
 * @param {string} val value of the element
 */
declare function initCheckboxesBlock(element: string, val: string): void;
/**
 * initializes a combobox (combination of input and select box)
 * @param {*} node - node representation for access to i18N function (node._())
 * @param {JQuery<HTMLElement>} $inputSelect - jQuery selector of the select element
 * @param {JQuery<HTMLElement>} $inputBox - jQuery selector of the input element
 * @param {string} dataListID - id of the datalist from getAutocompleteFormats()
 * @param {string} optionElementName - name of the element from getSelectFields()
 * @param {string} value - value of the input/select field
 * @param {number} baseWidth - base widtrh of the field combination
 * @param {string} [timeFormat] - name of tzhe timeformat from position-config:common.timeFormat...
 */
declare function initCombobox(node: any, $inputSelect: JQuery<HTMLElement>, $inputBox: JQuery<HTMLElement>, dataListID: string, optionElementName: string, value: string, baseWidth: number, timeFormat?: string): void;
/**
 * add a label to a html element
 * @param {JQuery<HTMLElement>} parent - element (row) to append the label
 * @param {string} forEl - name of the element to what the label is
 * @param {string} [symb] - class name of the symbol e.g. 'fa fa-clock'
 * @param {string} [text] - text of the label
 * @param {string} [width] - width of the label
 * @returns {JQuery<HTMLElement>} jQuery selector of the new label
 */
declare function addLabel(parent: JQuery<HTMLElement>, forEl: string, symb?: string, text?: string, width?: string): JQuery<HTMLElement>;
/**
* @typedef {Object} multiselectTypes
* @property {string} label - the name of the type property
* @property {RegExp} selection - regular expression selector
*/
/**
 * return the label who matches the regex selector for types
 * @param {string} val - value to test
 * @param {number} length - optional output if nothing is found
 * @param {Array.<multiselectTypes>} types - array of types
 * @returns {number|string} the selected label or the given length or 'NA'
 */
declare function getMultiselectText(val: string, length: number, types: Array<multiselectTypes>): number | string;
/**
 * set the checkboxes in a multiselect combo box to a value
 * @param {string} value - value of the array
 * @param {JQuery<HTMLElement>} field - parent jquery selector element
 * @param {Array.<multiselectTypes>} types - array of types
 */
declare function setMultiselect(value: string, field: JQuery<HTMLElement>, types: Array<multiselectTypes>): void;
/**
 * adds a multiselect combo box to the form
 * @param {*} node - Node Red Source Node
 * @param {JQuery<HTMLElement>} parent - parent jQuery selector to add multiselect
 * @param {string} elementName - Name of the element in the node, e.g. 'operatorTypes'
 * @param {string} i18N - i18N element name, e.g. 'time-comp.operatorTypes'
 * @param {string} id - element id, e.g. 'node-input-rule-operatorType-1'
 * @returns {JQuery<HTMLElement>} jQuery selector of the multiselect
 */
declare function multiselect(node: any, parent: JQuery<HTMLElement>, elementName: string, i18N: string, id: string): JQuery<HTMLElement>;
/**
* @typedef {Object} backendData
* @property {string} nodeId - the id of the node
* @property {('getTimeData'|'getOutDataData')} kind - kind of request
* @property {string} config - the config object
* @property {string} type - type input type
* @property {string} value - type input value
* @property {string} [offsetType] - type input type for offset
* @property {string} [offset] - type input value for offset
* @property {boolean} [noOffsetError] - if no offset error should be triggered
* @property {number} [multiplier] - multiplier to value
* @property {boolean} [next] - identifier if the next should be output
* @property {string} [days] - allowed days identifier
* @property {string} [months] - allowed days identifier
* @property {boolean} [onlyOddDays] - additional limitation
* @property {boolean} [onlyEvenDays] - additional limitation
* @property {boolean} [onlyOddWeeks] - additional limitation
* @property {boolean} [onlyEvenWeeks] - additional limitation
* @property {string} [format] - output format
*/
/**
 * get type Data from the backend
 * @param {*} result
 * @param {backendData} data
 * @returns {*} object based on the request
 */
declare function getBackendData(result: any, data: backendData): any;
/**
 * returns **true** if the parameter value is a valid boolean value for **true**
 * @param {*} val a parameter which should be checked if  it is a valid true boolean
 * @returns {boolean} true if the parameter value is a valid boolean value for **true**
 */
declare function isTrue(val: any): boolean;
/**
 * checks if a value is a valid Date object
 * @param {any} d - a value to check
 * @returns {boolean} returns __true__ if it is a valid Date, otherwhise __false__
 */
declare function isValidDate(d: any): boolean;
/**
 * formate Dtae to local time
 * @param {*} d - Date
 */
declare function bdDateToTime(d: any, add: any): any;
/**
 * get the value for the day checkbox array
 * @param {JQuery<HTMLElement>} value - the checkbox array
 * * @param {number} max - the maximum count of elements
 * @returns {string} the value of the checkboxes
 */
declare function getCheckboxesStr(value: JQuery<HTMLElement>, max: number): string;
/**
 * --- Type Defs ---
 */
type runtimeRED = import('./../types/typedefs.js').runtimeRED;
/**
 * --- Type Defs ---
 */
type $ = JQueryStatic;
type typesArr = {
    /**
     * - the value property
     */
    value: string;
    /**
     * - the type property
     */
    type: string;
};
type tiData = {
    /**
     * - the name of the value property
     */
    valueProp: string;
    /**
     * - the name of the type property
     */
    typeProp: string;
    /**
     * - list of allowed types
     */
    types?: Array<string | typesArr>;
    /**
     * - value for the default value
     */
    defaultValue?: string;
    /**
     * - value for the default type
     */
    defaultType?: string;
    /**
     * - a tootlip for the input field
     */
    tooltip?: string;
    /**
     * - width of the input field
     */
    width?: string;
    /**
     * - on change function
     */
    onChange?: string;
    /**
     * - on focus / focus lost function
     */
    onFocus?: string;
};
type multiselectTypes = {
    /**
     * - the name of the type property
     */
    label: string;
    /**
     * - regular expression selector
     */
    selection: RegExp;
};
type backendData = {
    /**
     * - the id of the node
     */
    nodeId: string;
    /**
     * - kind of request
     */
    kind: ('getTimeData' | 'getOutDataData');
    /**
     * - the config object
     */
    config: string;
    /**
     * - type input type
     */
    type: string;
    /**
     * - type input value
     */
    value: string;
    /**
     * - type input type for offset
     */
    offsetType?: string;
    /**
     * - type input value for offset
     */
    offset?: string;
    /**
     * - if no offset error should be triggered
     */
    noOffsetError?: boolean;
    /**
     * - multiplier to value
     */
    multiplier?: number;
    /**
     * - identifier if the next should be output
     */
    next?: boolean;
    /**
     * - allowed days identifier
     */
    days?: string;
    /**
     * - allowed days identifier
     */
    months?: string;
    /**
     * - additional limitation
     */
    onlyOddDays?: boolean;
    /**
     * - additional limitation
     */
    onlyEvenDays?: boolean;
    /**
     * - additional limitation
     */
    onlyOddWeeks?: boolean;
    /**
     * - additional limitation
     */
    onlyEvenWeeks?: boolean;
    /**
     * - output format
     */
    format?: string;
};
//# sourceMappingURL=htmlglobal.d.ts.map