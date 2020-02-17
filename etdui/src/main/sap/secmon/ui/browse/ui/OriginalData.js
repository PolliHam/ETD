/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.OriginalData");

$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("sap.secmon.ui.browse.utils");
// $.sap.require("sap.ui.core.util.Export");
// $.sap.require("sap.ui.core.util.ExportTypeCSV");
$.sap.require("sap.ui.table.TablePersoController");
$.sap.require("sap.secmon.ui.browse.Constants");

sap.ui.core.Control.extend("sap.secmon.ui.browse.OriginalData", {

    metadata : {

        properties : {
            title : {
                type : "string",
                defaultValue : "Original Data"
            },
            // subset : {
            // type : "string",
            // defaultValue : "Path1.Subset1"
            // },
            bindingPath : {
                type : "string",
            },
            headerIDs : {
                type : "object",
                defaultValue : {
                    workspaceContext : "Log",
                    queryId : "",
                    queryStartTime : "",
                    queryEndTime : "",
                    subset : "Path1.Subset1",
                }
            }
        },

        aggregations : {
            _toolbar1 : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _toolbar2 : {
                type : "sap.ui.commons.Toolbar",
                multiple : false,
                visibility : "hidden"
            },
            _layout1 : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            downloadAsZIP : {}
        }
    },

    _oHeaderTable : undefined,
    _oDetailTable : undefined,
    _oStartSubset : undefined,
    _sCurrentFilter : undefined,
    _oServiceMap : {},
    _oPersoModel : undefined,
    _oTPC : undefined,

    init : function() {

        this._oServiceMap.Log = {
            path : "OriginalLog",
            field : "Id"
        };

        this._oHeaderTable = new sap.ui.table.Table({
            width : "100%",
            selectionMode : sap.ui.table.SelectionMode.None,
            navigationMode : sap.ui.table.NavigationMode.Scrollbar,
            visibleRowCount : 10,
            threshold : 40
        // visibleRowCountMode: sap.ui.table.VisibleRowCountMode.Auto
        });

        this._oStartSubset = new sap.ui.commons.Label({});

        this._toolbar1 = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ this._oStartSubset ]
        });

        this._toolbar2 = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ new sap.ui.commons.Button({
                icon : sap.ui.core.IconPool.getIconURI("download"),
                text : "{i18n>BU_BUT_Download_ZIP}",
                tooltip : "{i18n>BU_TOL_Download_ZIP}",
                press : [ function(oEvent) {
                    this.fireDownloadAsZIP();
                    this._downloadRecordsAsZIP(oEvent);
                }, this ]
            }) ]
        });

        this._layout1 = new sap.ui.layout.VerticalLayout({
            width : "100%",
            content : [ this._oHeaderTable ]
        });

        this.setAggregation("_toolbar1", this._toolbar1);
        this.setAggregation("_toolbar2", this._toolbar2);
        this.setAggregation("_layout1", this._layout1);
    },

    getHeaderTable : function() {
        return this._oHeaderTable;
    },

    _buildTables : function() {

        this._oHeaderTable.destroyColumns();
        if (this._oHeaderTable.getBinding("rows")) {
            this._oHeaderTable.unbindRows();
        }

        this._oHeaderTable.setVisibleRowCount(20);
        var oModel = this.getModel();

        oModel.attachRequestCompleted(function() {
            this._oHeaderTable.setProperty("noDataText", oTextBundle.getText("BU_NormalData_NoData"));
        }, this).attachRequestSent(function() {
            this._oHeaderTable.setProperty("noDataText", oTextBundle.getText("BU_NormalData_Loading"));
        }, this);

        this._setColumns(this._oHeaderTable, oModel, 0);

        var aFilters = [];
        aFilters.push(new sap.ui.model.Filter({
            path : 'Id',
            operator : sap.ui.model.FilterOperator.EQ,
            value1 : this.getHeaderIDs().queryId
        }));

        // display the newest data first
        var aSorters = [];
        aSorters.push(new sap.ui.model.Sorter({
            path : 'Timestamp',
            descending : true
        }));

        // this._oHeaderTable.setModel(this.getModel());
        this._oHeaderTable.bindRows("/" + this._oServiceMap[this.getHeaderIDs().workspaceContext].path, null, aSorters, aFilters);
    },

    _setColumns : function(oTable, oModel, iCollectionIndex, sIdPrefix) {
        var oMetadata = oModel.getServiceMetadata();
        var aProperty = oMetadata.dataServices.schema[0].entityType[iCollectionIndex].property;
        var oTemplate = {};
        for (var i = 0, max = aProperty.length; i < max; i++) {
            if (aProperty[i].name === "Id" || aProperty[i].name === "MapId" || aProperty[i].name === "GenID" || aProperty[i].name === "HeaderId" ||
                    aProperty[i].name === "TechnicalTimestampOfInsertion") {
                continue;
            }

            if (aProperty[i].type === "Edm.DateTime") {
                oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
                    path : aProperty[i].name,
                    formatter : function(value) {
                        if (value) {
                            return sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getModel('applicationContext').getData().UTC, value);
                        } else {
                            return "";
                        }
                    }.bind(this)
                });
            } else if (aProperty[i].type === "Edm.Binary") {
                oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
                    path : aProperty[i].name,
                    formatter : function(value) {
                        if (value) {
                            return sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(value);
                        } else {
                            return "";
                        }
                    }
                });
            } else {
                oTemplate = new sap.m.Text().bindProperty("text", aProperty[i].name);
            }

            oTable.addColumn(new sap.ui.table.Column({
                // id : (sIdPrefix ? sIdPrefix : "") + aProperty[i].name,
                width : aProperty[i].name === "Timestamp" ? "200px" : aProperty[i].name === "ShortMessage" ? "100%" : "50%",
                tooltip : aProperty[i].name,
                label : new sap.ui.commons.Label({
                    text : aProperty[i].name
                }),
                template : oTemplate,
                sortProperty : aProperty[i].name,
                filterProperty : aProperty[i].name
            }));
        }
    },

    setHeaderIDs : function(value) {
        this.setProperty("headerIDs", value);
        this._oStartSubset.setText(this.getProperty("headerIDs").subset);
        if (value.collection) {
            this._oServiceMap.Log.path = value.collection;
        }
        this._buildTables();
    },

    _downloadRecordsAsZIP : function(oEvent) {
        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oWorkspaceData = oWorkspaceModel.getData();

        // convert relative to absolute time period
        var dFrom, dTo;
        if (oWorkspaceData.period.operator === "=") {
            if (oWorkspaceData.now) {
                dTo = new Date(Date.parse(oWorkspaceData.now));
            } else {
                dTo = new Date();
            }
            dFrom = new Date(dTo.getTime() - sap.secmon.ui.browse.Constants.C_REL_TIME_LIST[oWorkspaceData.period.searchTerms[0]]);

            oWorkspaceData.period.operator = "BETWEEN";
            oWorkspaceData.period.searchTerms = [ sap.secmon.ui.browse.utils.formatDateTime(dFrom), sap.secmon.ui.browse.utils.formatDateTime(dTo) ];
        }

        var sStartSubset = this.getHeaderIDs().subset;
        var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oWorkspaceData, "getZipData");
        oQuery.original = true;

        // download the zipfile thru a proxy service
        sap.secmon.ui.browse.utils.downloadZipfile("/sap/secmon/ui/browse/services2/getZippedLogEntries.xsjs", oQuery);

    },

    exit : function() {
    },

    onBeforeRendering : function() {
    },

    onAfterRendering : function() {
    },

    renderer : function(oRm, oControl) {

        oRm.write("<div");
        oRm.writeControlData(oControl); // writes the Control ID and enables
        oRm.writeClasses(); // there is no class to write, but this enables
        oRm.write(">");
        oRm.renderControl(oControl._toolbar1);
        oRm.renderControl(oControl._toolbar2);
        oRm.renderControl(oControl._layout1);
        oRm.write("</div>"); // end of the complete Control
    }

});