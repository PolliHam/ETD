/* global oTextBundle */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.TableFunctions");

sap.ui.jsview("sap.secmon.ui.commons.ValueSelectionView", {

    oController : null,
    commons : new sap.secmon.ui.commons.CommonFunctions(),
    tableFunctions : new sap.secmon.ui.commons.TableFunctions(),

    /**
     * Specifies the Controller belonging to this View. In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * 
     * @memberOf views.Companies
     */
    getControllerName : function() {
        return "sap.secmon.ui.commons.ValueSelectionView";
    },
    /**
     * Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. Since the Controller is given to this method, its event handlers can be
     * attached right away.
     * 
     * @memberOf views.Companies{
     */
    createContent : function(oController) {
        this.oController = oController;
        return this.createSelectionTable();
    },

    createSelectionTable : function() {
        this.oValueSelectionTable = new sap.ui.table.Table({
            visibleRowCount : 10,
            columnHeaderHeight : 30,
            selectionMode : sap.ui.table.SelectionMode.Single,
            navigationMode : sap.ui.table.NavigationMode.Paginator,
        });

        return this.oValueSelectionTable;
    },

    bindModel : function(aggregationName, aValueHelpModelFilter) {
        this.oValueSelectionTable.bindRows({
            path : aggregationName,
            filters : aValueHelpModelFilter
        });
    },

    setColumnInfo : function(columnInfo) {
        var that = this;
        columnInfo.forEach(function(e) {
            that.oValueSelectionTable.addColumn(that.tableFunctions.createColumn(oTextBundle, e.textKey, e.property));
        });
    },

    getSelectedRowContext : function() {
        var index = this.oValueSelectionTable.getSelectedIndex();
        if (index === -1) {
            return null;
        }
        var context = this.oValueSelectionTable.getContextByIndex(index);
        return context;
    }

}

);
