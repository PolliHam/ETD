/* globals sLocale */
$.sap.declare("sap.secmon.ui.monitoring.ArtifactList");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.ui.model.odata.CountMode");

/**
 * Custom control to provide a List of Workspaces arranged in a Table. A selected Workspace can be opened, shared or removed. A Workspace can be either private or public.
 * 
 * @see: ArtifactList.js
 */
sap.ui.core.Control.extend("sap.secmon.ui.monitoring.ArtifactList", {

    metadata : {
        properties : {
            title : {
                type : "string"
            },
            "width" : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            },
            "height" : {
                type : "sap.ui.core.CSSSize",
                group : "Dimension",
                defaultValue : "100%"
            }
        },

        aggregations : {
            _table : {
                type : "sap.ui.table.Table",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            openWorkspace : {
                modelPath : "string",
                workspaceId : "string"
            },
        }
    },

    _oRowTable : undefined,

    init : function() {
        var oModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/monitoringPage.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oModel);

        this._oRowTable = new sap.ui.table.Table({
            width : "100%",
            height : "100%",
            rowSelectionChange : function(oEvent) {
                var oData = sap.ui.getCore().getModel("MonitoringModel").getData();
                oData.selectedChartId = oEvent.getParameters().rowContext.sPath.substring(8, 40);
                sap.ui.getCore().getModel("MonitoringModel").setData(oData);
            },
            visibleRowCountMode : sap.ui.table.VisibleRowCountMode.Auto,
            minAutoRowCount : 15,
            selectionMode : sap.ui.table.SelectionMode.Single,
            showColumnVisibilityMenu : true,
            columns : [ new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>MonName}"
                }),
                template : new sap.ui.commons.TextView({
                    text : "{Name}"
                }),
                filterProperty : "Name",
                sortProperty : "Name",
                width : "30em"
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>MonNamespace}"
                }),
                template : new sap.ui.commons.TextView({
                    text : "{Namespace}"
                }),
                filterProperty : "Namespace",
                sortProperty : "Namespace",
                width : "20em"
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_Description}"
                }),
                template : new sap.ui.commons.TextView({
                    text : {
                        path : "Description",
                        formatter : function(sValue) {
                            // remove line breaks
                            if (sValue) {
                                sValue = sValue.replace(/(\r\n|\n|\r)/gm, " ");
                                return sValue;
                            } else {
                                return "";
                            }

                        }
                    }
                }),
                filterProperty : "Description",
                sortProperty : "Description"
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>MonType}"
                }),
                template : new sap.ui.commons.TextView({
                    text : "{Type}"
                }),
                filterProperty : "Type",
                sortProperty : "Type",
                width : "7em"
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_WSCreatedBy}"
                }),
                template : new sap.ui.commons.TextView({
                    text : "{UserId}"
                }),
                filterProperty : "UserId",
                sortProperty : "UserId",
                width : "12em",
                visible : false
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>MonChangedBy}"
                }),
                template : new sap.ui.commons.TextView({
                    text : "{ChangedByUserId}"
                }),
                filterProperty : "ChangedByUserId",
                sortProperty : "ChangedByUserId",
                width : "12em",
                visible : false
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_WSCreatedTS}"
                }),
                width : "22em",
                visible : false,
                template : new sap.ui.commons.TextView({
                    text : {
                        path : "CreationTimestamp",
                        formatter : function(value) {
                            var _oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                locale : sLocale,
                                style : "long"
                            });
                            if (value) {
                                return _oDateFormatter.format(value, false);
                            } else {
                                return "";
                            }
                        }
                    }
                }),
                sortProperty : "CreationTimestamp",
                filterProperty : "CreationTimestamp"
            }), new sap.ui.table.Column({
                label : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_WSChangedTS}"
                }),
                width : "22em",
                visible : false,
                template : new sap.ui.commons.TextView({
                    text : {
                        path : "ChangeTimestamp",
                        formatter : function(value) {
                            var _oDateFormatter = sap.ui.core.format.DateFormat.getDateTimeInstance({
                                locale : sLocale,
                                style : "long"
                            });
                            if (value) {
                                return _oDateFormatter.format(value, false);
                            } else {
                                return "";
                            }
                        }
                    }
                }),
                sortProperty : "ChangeTimestamp",
                filterProperty : "ChangeTimestamp"
            }) ]
        });

        this._oRowTable.bindRows("/Qube", null, new sap.ui.model.Sorter("Name"));
        this._oRowTable.getColumns()[0].setSorted(true);

        this.setAggregation("_table", this._oRowTable);
    },

    renderer : function(oRm, oControl) {

        oRm.write("<div");
        oRm.write(' style="width: ' + oControl.getWidth() + '; height: ' + oControl.getHeight() + ';"');
        oRm.writeControlData(oControl); // writes the Control ID and enables
        oRm.writeClasses(); // there is no class to write, but this enables
        oRm.write(">");
        oRm.renderControl(oControl._oRowTable);
        oRm.write("</div>"); // end of the complete Control
    }
});
