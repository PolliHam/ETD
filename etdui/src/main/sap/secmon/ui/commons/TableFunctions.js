/* global oTextBundle */

jQuery.sap.declare("sap.secmon.ui.commons.TableFunctions");

sap.secmon.ui.commons.TableFunctions = function() {
    if (sap.secmon.ui.commons.TableFunctions.prototype.singletoninstance) {
        return sap.secmon.ui.commons.TableFunctions.prototype.singletoninstance;
    }
    sap.secmon.ui.commons.TableFunctions.prototype.singletoninstance = this;

    this.createBaseColumn = function(messageProvider, heading, propertyName, template) {
        var oColumn = new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : messageProvider.getText(heading)
            }),
            template : template,
            sortProperty : propertyName,
            filterProperty : propertyName
        });
        return oColumn;
    };

    this.createColumn = function(messageProvider, heading, propertyName) {
        var template = new sap.ui.commons.TextView().bindProperty("text", propertyName);
        return this.createBaseColumn(messageProvider, heading, propertyName, template);
    };

    this.unbindTableRows = function(table) {
        if (table.getBinding('rows')) {
            // calling unbindRows on an unbound table results in an error
            table.unbindRows();
            // clear selection to avoid zombie lines being selected
            table.clearSelection();
        }
    };

    this.getRowActionExecutor = function(oTable, oController, noSelectionMessageId) {
        return function(action, confimationMsg) {
            function executeAction(index, action) {
                var context = oTable.getContextByIndex(index);
                action.bind(oController)(context);
            }

            var index = oTable.getSelectedIndex();
            if (index === -1) {
                alert(oTextBundle.getText(noSelectionMessageId));
                return;
            }
            if (confimationMsg) {
                sap.ui.commons.MessageBox.confirm(oTextBundle.getText(confimationMsg), function(bResult) {
                    if (bResult) {
                        executeAction(index, action);
                    }
                }, oTextBundle.getText(confimationMsg));
            } else {
                executeAction(index, action);
            }
        };
    };

};
