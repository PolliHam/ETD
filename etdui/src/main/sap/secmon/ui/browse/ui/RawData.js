/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.RawData");

$.sap.require("sap.ui.core.format.DateFormat");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.ui.core.util.Export");
$.sap.require("sap.ui.core.util.ExportTypeCSV");
$.sap.require("sap.ui.table.TablePersoController");
$.sap.require("sap.secmon.ui.browse.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.core.Control.extend("sap.secmon.ui.browse.RawData", {

    metadata : {

        properties : {
            title : {
                type : "string",
                defaultValue : "Raw Data"
            },
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
            },
            _layout2 : {
                type : "sap.ui.layout.VerticalLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            download : {
                format : "string", // ZIP | CSV | JSON
                selected : "boolean"
            },
        }
    },

    _oHeaderTable : undefined,
    _oDetailTable : undefined,
    _oStartSubset : undefined,
    _sCurrentFilter : undefined,
    _oServiceMap : {},
    _oPersoModel : undefined,
    _oTPC : undefined,
    _aaVisibleColumns : {
        "Id" : true,
        "Timestamp" : true
    }, // associated array for visible columns, Id and Timestamp are required fields
    _oInconsistentNames : {}, 
    _oDownloadBtn : undefined,
    C_DOWNLOAD_FORMAT : {
        ZIP : "ZIP",
        CSV : "CSV",
        JSON : "JSON"
    },

    init : function() {

        var that = this;

        this._oServiceMap[sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG] = {
            path : "LogHeader",
            field : "Id",
            perso : "etdLogHeaderPersonalization"
        };
        this._oServiceMap[sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT] = {
            path : "AlertHeader",
            field : "AlertId",
            perso : "etdAlertHeaderPersonalization"
        };
        this._oServiceMap[sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.HEALTH_CHECK] = {
            path : "LogHeader",
            field : "HeaderId",
            perso : "etdHealthCheckHeaderPersonalization"
        };
        this._oServiceMap[sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.CONFIG_CHECK] = {
            path : "LogHeader",
            field : "TechnicalId",
            perso : "etdConfigCheckHeaderPersonalization"
        };

        this._oHeaderTable = new sap.ui.table.Table({
            id : "etdHeaderTable",
            width : "100%",
            // showColumnVisibilityMenu : true,
            selectionMode : sap.ui.table.SelectionMode.Single,
            navigationMode : sap.ui.table.NavigationMode.Scrollbar,
            rowSelectionChange : [ function(oEvent) {
                this._updateDetails(oEvent);
            }, this ],
        });

        this._oDetailTable = new sap.ui.table.Table({
            width : "100%",
            navigationMode : sap.ui.table.NavigationMode.Scrollbar,
        });

        this._oStartSubset = new sap.ui.commons.Label({});

        this._toolbar1 = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ this._oStartSubset ]
        });

        var aaFormat = {
            "BU_BUT_Download" : that.C_DOWNLOAD_FORMAT.JSON,
            "BU_BUT_Download_CSV" : that.C_DOWNLOAD_FORMAT.CSV,
            "BU_BUT_Download_ZIP" : that.C_DOWNLOAD_FORMAT.ZIP,
        };

        var fnHandlePress = function(oEvent) {
            var bSelected = this._toolbar2.getItems()[4] ? this._toolbar2.getItems()[4].getChecked() : false;
            var bSelectedHiddenCols = this._toolbar2.getItems()[3].getChecked();
            if(bSelected || bSelectedHiddenCols){
                oEvent.mParameters.selected = true;
            }
            var key = oEvent.getSource().getBinding("text").sPath;
            this.fireDownload({
                format : aaFormat[key],
                selected : bSelected
            });
            this["_downloadRecordsAs" + aaFormat[key]](oEvent);

        };

        this._oDownloadBtn = new sap.ui.commons.Button({
            icon : sap.ui.core.IconPool.getIconURI("download"),
            visible : "{applicationContext>/userPrivileges/contentDownload}",
            text : "{i18n>BU_BUT_Download_ZIP}",
            tooltip : "{i18n>BU_TOL_Download_ZIP}",
            press : [ fnHandlePress, this ]
        });

        this._toolbar2 = new sap.ui.commons.Toolbar({
            design : "Standard",
            items : [ new sap.ui.commons.Button({
                icon : sap.ui.core.IconPool.getIconURI("download"),
                visible : "{applicationContext>/userPrivileges/contentDownload}",
                text : "{i18n>BU_BUT_Download}",
                tooltip : "{i18n>BU_TOL_Download}",
                press : [ fnHandlePress, this ]
            }), new sap.ui.commons.Button({
                icon : sap.ui.core.IconPool.getIconURI("download"),
                visible : "{applicationContext>/userPrivileges/contentDownload}",
                text : "{i18n>BU_BUT_Download_CSV}",
                tooltip : "{i18n>BU_TOL_Download_CSV}",
                press : [ fnHandlePress, this ]
            }), that._oDownloadBtn,

            new sap.ui.commons.CheckBox({
                selected : false,
                text : "{i18n>BU_BUT_Hide_Empty_Col}",
                tooltip : "{i18n>BU_BUT_Hide_Empty_Col}",
                change : [ function(oEvent) {
                    this.onHideEmptyColumns(oEvent.getParameter("checked"));
                }, this ]
            }), new sap.ui.commons.CheckBox({
                selected : false,
                text : "{i18n>BU_BUT_Download_Shown}",
                tooltip : "{i18n>BU_TOL_Download_Shown}",
                change : [ function(oEvent) {
                    this._bSelectedColumns = oEvent.getParameter("checked");
                }, this ]
            }) ],
            rightItems : [ new sap.ui.commons.Button({
                icon : sap.ui.core.IconPool.getIconURI("wrench"),
                tooltip : "{i18n>BU_TOL_Personalize}",
                press : [ function(oEvent) {
                    this._personalize(oEvent);
                }, this ]
            }) ]
        });

        this._layout1 = new sap.ui.layout.VerticalLayout({
            width : "100%",
            content : [ this._oHeaderTable ]
        });
        this._layout2 = new sap.ui.layout.VerticalLayout({
            width : "100%",
            content : [ this._oDetailTable ]
        });

        this.setAggregation("_toolbar1", this._toolbar1);
        this.setAggregation("_toolbar2", this._toolbar2);
        this.setAggregation("_layout1", this._layout1);
        this.setAggregation("_layout2", this._layout2);
    },

    _setDetailColumnsStatic : function() {
        this._oDetailTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>RD_Details_Name}"
            }),
            template : new sap.ui.commons.TextView().bindProperty("text", "Name"),
            sortProperty : "Name",
            filterProperty : "Name"
        }));

        this._oDetailTable.addColumn(new sap.ui.table.Column({
            label : new sap.ui.commons.Label({
                text : "{i18n>RD_Details_Value}"
            }),
            template : new sap.ui.commons.TextView().bindProperty("text", {
                parts : [ {
                    path : "ValueType"
                }, {
                    path : "ValueVarChar"
                }, {
                    path : "ValueInteger"
                }, {
                    path : "ValueBigInt"
                }, {
                    path : "ValueTimeStamp"
                } ],

                formatter : function(valueType, valueVarChar, valueInteger, valueBigInt, valueTimeStamp) {

                    switch (valueType) {
                    case "ValueVarChar":
                        return valueVarChar;
                    case "ValueInteger":
                        return valueInteger;
                    case "ValueBigInt":
                        return valueBigInt;
                    case "ValueTimeStamp":
                    case "ValueTimestamp":
                    case "ValueVarTimeStamp":
                        if (valueTimeStamp) {
                            return sap.secmon.ui.commons.Formatter.dateFormatterEx(this.getModel('applicationContext').getData().UTC, valueTimeStamp);
                        } else {
                            return "";
                        }
                        break;
                    }
                }.bind(this)
            })
        }));
    },

    _setColumns : function(oTable, oModel, iCollectionIndex, sIdPrefix) {
        var oMetadata = oModel.getServiceMetadata();
        var aProperties = oMetadata.dataServices.schema[0].entityType[iCollectionIndex].property;
        var oTemplate = {};
        var aPath = [];
        var aProperty = [];

        var sContext = this.getHeaderIDs().workspaceContext;
        var oFieldNamesData = sap.ui.getCore().getModel("FieldNamesModel").getData();
        var fnToGoodName = function(sName, bShort) {
            // in case the sName is not found => echo
            var result = sName;
            if (bShort) {
                if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].displayName) {
                    result = oFieldNamesData[sContext][sName].displayName;
                }
            } else {
                if (oFieldNamesData[sContext] && oFieldNamesData[sContext][sName] && oFieldNamesData[sContext][sName].description) {
                    result = oFieldNamesData[sContext][sName].description;
                }
            }
            return result;
        };
         
        // Show "Username<Role> attributes" if only authorization exists
        if (!this.getModel('applicationContext').getProperty("/userPrivileges/plainUser")) {
            var aAttrConstantsNames = [];

            for (var oProp in sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES){
                aAttrConstantsNames.push(sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES[oProp].name);
            }

            aProperty =  aProperties.filter(function(oItem){
                if(aAttrConstantsNames.indexOf(oItem.name) === -1){ 
                    return oItem;
                }
            }.bind(this));
        } else {
            aProperty = aProperties;
        }
        
        var bUTC = this.getModel('applicationContext').getData().UTC;
        
        for (var i = 0, max = aProperty.length; i < max; i++) {

            if(sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG && 
                oFieldNamesData[sContext][aProperty[i].name] && 
                aProperty[i].name !== oFieldNamesData[sContext][aProperty[i].name].fieldName) {
                    aPath = [oFieldNamesData[sContext][aProperty[i].name].fieldName, aProperty[i].name];
                    this._oInconsistentNames[oFieldNamesData[sContext][aProperty[i].name].fieldName] = aProperty[i].name;
            } else {
                aPath = [aProperty[i].name];
            }
           
            if (aProperty[i].name === "MapId" || aProperty[i].name === "GenID" || aProperty[i].name === "AlertId.AlertId") {
                continue;
            }

            if (aProperty[i].type === "Edm.DateTime") {
                oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
                    parts : aPath,
                    formatter : function(val1, val2) {
                        if (val1 || val2) {
                            return sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, val1) || sap.secmon.ui.commons.Formatter.dateFormatterEx(bUTC, val2);
                        } else {
                            return "";
                        }
                    }
                });
            } else if (aProperty[i].type === "Edm.Binary") {
                oTemplate = new sap.ui.commons.TextView().bindProperty("text", {
                    parts : aPath,
                    formatter : function(val1, val2) {
                        if (val1 || val2) {
                            return sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(val1) || sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(val2);
                        } else {
                            return "";
                        }
                    }
                });
            } else {
                oTemplate = new sap.ui.commons.TextView().bindProperty("text",{ 
                    parts : aPath,
                    formatter : function(val1, val2){
                        if(val1 && val2){
                            return val2;
                        } else {
                            return val1 || val2;
                        }
                    }
                });
            }

            oTable.addColumn(new sap.ui.table.Column({
                id : (sIdPrefix ? sIdPrefix : "") + aProperty[i].name,
                tooltip : fnToGoodName(this.getModel("i18nknowledge").getProperty("/" + aProperty[i].name), false),
                label : new sap.ui.commons.Label({
                    text : fnToGoodName(this.getModel("i18nknowledge").getProperty( aProperty[i].name), true)
                }),
                template : oTemplate,
                sortProperty : aProperty[i].name,
                filterProperty : aProperty[i].name
            }));
        }
    },

    _initAvailableFiltersModel : function() {
        var that = this;
        if (this.getHeaderIDs() !== undefined) {
            var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
            var oWorkspaceData = oWorkspaceModel.getData();
            var sContext = this.getHeaderIDs().workspaceContext;

            var oFieldNamesModel = sap.ui.getCore().getModel("FieldNamesModel");
            var oFieldNamesData = oFieldNamesModel.getData();

            if (!oFieldNamesData.hasOwnProperty(sContext)) {
                var sStartSubset = this.getHeaderIDs().subset;
                var promise = sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
                    context : sContext,
                    subsetId : sStartSubset
                } ], oWorkspaceData);

                promise.done(function(response, textStatus, XMLHttpRequest) {
                    // convert to associated array
                    var aaFieldNames = {};
                    // Camel cased -> capitalized
                    function capitalizeCamelCase(str) {
                        return str.charAt(0).toUpperCase() + str.slice(1);
                    }
                    
                    response.data.forEach(function(oAttr) {
                        // Event (Semantic) -> EventSemantic
                        // Event Source ID -> EventSourceId

                        aaFieldNames[capitalizeCamelCase(oAttr.name)] = {
                            fieldName : oAttr.fieldName,
                            displayName : that.getModel("i18nknowledge").getProperty(oAttr.displayName),
                            description : that.getModel("i18nknowledge").getProperty(oAttr.description)
                        };
                    });
                    oFieldNamesData[sContext] = aaFieldNames;
                    oFieldNamesModel.setData(oFieldNamesData);
                    that._buildTables();
                });
                promise.fail(function(jqXHR, textStatus, errorThrown) {
                    var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                    sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                });
            } else {
                this._buildTables();
            }
        }
    },

    _personalize : function(oEvent) {
        this._oTPC.openDialog();
    },

    setHeaderIDs : function(value) {
        this.setProperty("headerIDs", value);
        this._oStartSubset.setText(this.getProperty("headerIDs").subset);
        if (value.collection) {
            this._oServiceMap[value.workspaceContext].path = value.collection;
        }

        this._initAvailableFiltersModel();
    },

    _getDefaultPersoSettings : function(sContext) {
        if (!this._oPersoModel) {
            this._oPersoModel = new sap.ui.model.json.JSONModel();
            this._oPersoModel.loadData("ui/rawDataDefaultTableSettings.json", null, false);
        }
        return this._oPersoModel.getData()[sContext] || {};
    },

    _buildTables : function() {

        var that = this;

        this._oHeaderTable.destroyColumns();
        if (this._oHeaderTable.getBinding("rows")) {
            this._oHeaderTable.unbindRows();
        }

        this._oDetailTable.destroyColumns();
        if (this._oDetailTable.getBinding("rows")) {
            this._oDetailTable.unbindRows();
        }

        var sContext = this.getHeaderIDs().workspaceContext;
        var bShowDetails = sContext !== sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG && sContext !== sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.CONFIG_CHECK;
        this._layout2.setVisible(bShowDetails);

        var oModel = {};

        switch (sContext) {
        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG: // "Log":
            oModel = this.getModel();

            oModel.attachRequestCompleted(function() {
                this._oHeaderTable.setProperty("noDataText", oTextBundle.getText("BU_NormalData_NoData"));
            }, this).attachRequestSent(function() {
                this._oHeaderTable.setProperty("noDataText", oTextBundle.getText("BU_NormalData_Loading"));
            }, this);

            this._oHeaderTable.setVisibleRowCount(20);
            this._setDetailColumnsStatic();
            this._setColumns(this._oHeaderTable, oModel, 1);
            break;

        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT: // "Alert":
            oModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_ALERTS_PATH, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this._oHeaderTable.setVisibleRowCount(10);
            this._setColumns(this._oDetailTable, oModel, 1, "_det");
            this._setColumns(this._oHeaderTable, oModel, 0);
            break;

        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.HEALTH_CHECK: // "HealthCheck":
            oModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_HEALTHCHECKS_PATH, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this._oHeaderTable.setVisibleRowCount(10);
            this._setDetailColumnsStatic();
            this._setColumns(this._oHeaderTable, oModel, 0);
            break;

        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.CONFIG_CHECK: // "ConfigurationCheck":
            oModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_CONFIGCHECKS_PATH, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this._oHeaderTable.setVisibleRowCount(20);
            this._setDetailColumnsStatic();
            this._setColumns(this._oHeaderTable, oModel, 0);
            break;
        }

        var sTimestampCol = 'Timestamp';
        this._aaVisibleColumns = {
            "Id" : true,
            "Timestamp" : true
        };
        if (sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT) {
            this._aaVisibleColumns.AlertCreationTimestamp = true;
            delete this._aaVisibleColumns.Timestamp;
            sTimestampCol = 'AlertCreationTimestamp';
        }

        var aFilters = [];
        aFilters.push(new sap.ui.model.Filter({
            path : 'Id',
            operator : sap.ui.model.FilterOperator.EQ,
            value1 : this.getHeaderIDs().queryId
        }));
        if (sContext !== sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG) {
            sTimestampCol = sContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT ? "AlertCreationTimestamp" : sTimestampCol;
            aFilters.push(new sap.ui.model.Filter({
                path : sTimestampCol,
                operator : sap.ui.model.FilterOperator.BT,
                value1 : this.getHeaderIDs().queryStartTime,
                value2 : this.getHeaderIDs().queryEndTime
            }));
        }

        // display the newest data first
        var aSorters = [];
        aSorters.push(new sap.ui.model.Sorter({
            path : sTimestampCol,
            descending : true
        }));

        // setup the personalization
        this._oTPC = new sap.ui.table.TablePersoController({
            table : this._oHeaderTable,
            persoService : {
                getPersData : function() {
                    var oDeferred = new jQuery.Deferred();

                    var sJSON = window.localStorage.getItem(that._oServiceMap[sContext].perso);
                    var oBundle = sJSON ? JSON.parse(sJSON) : that._getDefaultPersoSettings(sContext);
                    
                    oDeferred.resolve(oBundle);

                    oBundle.aColumns.forEach(function(oCol) {
                        if (oCol.visible) {
                            that._aaVisibleColumns[oCol.id.split('-')[1]] = true;
                        }
                    });

                    return oDeferred.promise();
                },
                setPersData : function(oBundle) {
                    var oDeferred = new jQuery.Deferred();
                    var aCurrentVisibleCols = that.getCurrentVisibleColumns(oBundle);
                    var sJSON = JSON.stringify(oBundle);
                    window.localStorage.setItem(that._oServiceMap[sContext].perso, sJSON);
                    for ( var prop in that._aaVisibleColumns) {
                        delete that._aaVisibleColumns[prop];
                    }
                    this.getPersData();
                    var bChanged = Object.keys(that._aaVisibleColumns).length === aCurrentVisibleCols.length ? true : false;
                    if(!bChanged){
                        that._oHeaderTable.bindRows({
                            path : "/" + that._oServiceMap[sContext].path,
                            sorter : aSorters,
                            filters : aFilters,
                            parameters : {
                                select : Object.keys(that._aaVisibleColumns).toString()
                            }
                        }).getBinding("rows").attachDataReceived(function() {
                            oDeferred.resolve();
                            if(that._toolbar2.getItems()[3].getChecked()){
                                that.onHideEmptyColumns(true);
                            }
                        });
                    } else {
                        oDeferred.resolve();
                        if(that._toolbar2.getItems()[3].getChecked()){
                            that.onHideEmptyColumns(true);
                        }
                    }
 
                    return oDeferred.promise();
                },
                delPersData : function() {
                    var oDeferred = new jQuery.Deferred();
                    window.localStorage.removeItem(that._oServiceMap[sContext].perso);
                    oDeferred.resolve();
                    return oDeferred.promise();
                }
            },
        });

        // enable the DownloadZip button only for Log events
        this._oDownloadBtn.bindProperty("visible", {
            path : "WorkspaceModel>" + that.getProperty("bindingPath").split("/filters")[0],
            formatter : function(oVal) {
                return oVal.context === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG;
            }
        });

        this._oHeaderTable.setModel(oModel);

        this.adaptParamsForCall();
        // parameters enables the $select for oData which optimizes the backend call
        this._oHeaderTable.bindRows({
            path : "/" + this._oServiceMap[sContext].path,
            sorter : aSorters,
            filters : aFilters,
            parameters : {
                select : Object.keys(that._aaVisibleColumns).toString()
            }
        });
        this._oHeaderTable.getBinding().attachDataReceived(fnSetDetail);

        function fnSetDetail() {
            that._oHeaderTable.setSelectedIndex(-1);
            that._oHeaderTable.setSelectedIndex(0);
            that.setBusy(false);
            if(that._toolbar2.getItems()[3].getChecked()){
                that.onHideEmptyColumns(true);
            }
        }
        this._oDetailTable.setModel(oModel);

        // _sCurrentFilter is required for download, which must be the same as aFilters
        // see method _downloadRecords
        this._sCurrentFilter = this._oServiceMap[sContext].path + "?$filter=" + "Id" + "%20eq%20X%27" + this.getHeaderIDs().queryId + "%27";
    },

    _updateDetails : function(oEvent) {

        if (this.getHeaderIDs().workspaceContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG ||
                this.getHeaderIDs().workspaceContext === sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.CONFIG_CHECK) {
            return;
        }

        var oCurrentRowContext = oEvent.getParameter("rowContext");
        if (oCurrentRowContext) { // oCurrentRowContext could be undefined || null
            var sUrl = oCurrentRowContext.sPath + "/Details";
            this._oDetailTable.bindRows(sUrl);
        }
    },

    _downloadRecordsAsJSON : function(oEvent) {

        var sHref = "";
        var sFileName = "";
        var sSelect = "";
        var sFilter = this._sCurrentFilter;
        var oSelectedColumns = {};
        if(oEvent.getParameter("selected")){
            this._oHeaderTable.getColumns().forEach(function(oCol){
                if(oCol.getVisible()){
                    oSelectedColumns[oCol.sId] = true;
                }
                sSelect = Object.keys(oSelectedColumns);
            });
        } else {
            sSelect = oEvent.getSource().getParent().getParent()._oHeaderTable.getBinding("rows").mParameters.select;
        }

        switch (this.getHeaderIDs().workspaceContext) {
        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.LOG:
            // include b$select attribute
            sHref = sap.secmon.ui.browse.Constants.C_ODATA_LOGS_PATH_XSJS + "/" + sFilter + (oEvent.getParameter("selected") ? "&$select=" + sSelect : "");
            // "/sap/secmon/ui/browse/services2/logEntries.xsjs" + "/" + sFilter;
            sFileName = "logEntries.json";
            break;
        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.ALERT: // "Alert":
            sHref = sap.secmon.ui.browse.Constants.C_ODATA_ALERTS_PATH + "/" + sFilter + "&$expand=Details" + (oEvent.getParameter("selected") ? "&$select=" + sSelect : "") + "&$format=json";
            sFileName = "alerts.json";
            break;
        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.HEALTH_CHECK: // "HealthCheck":
            sHref = sap.secmon.ui.browse.Constants.C_ODATA_HEALTHCHECKS_PATH + "/" + sFilter + "&$expand=Details" + (oEvent.getParameter("selected") ? "&$select=" + sSelect : "") + "&$format=json";
            sFileName = "healthCheck.json";
            break;
        case sap.secmon.ui.browse.Constants.C_BROWSING_CONTEXT.CONFIG_CHECK: // "ConfigurationCheck":
            sHref = sap.secmon.ui.browse.Constants.C_ODATA_CONFIGCHECKS_PATH + "/" + sFilter + (oEvent.getParameter("selected") ? "&$select=" + sSelect : "") + "&$format=json";
            sFileName = "configCheck.json";
            break;
        }

        var document = oEvent.getSource().getDomRef().ownerDocument;
        var downloadLink = document.createElement("a");
        downloadLink.href = sHref;
        downloadLink.download = sFileName;

        var mapInput = document.createElement("input");
        mapInput.setAttribute("type", "hidden");
        mapInput.setAttribute("name", "param1");
        mapInput.setAttribute("value", "fff");

        downloadLink.appendChild(mapInput);

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    },

    onHideEmptyColumns : function(bSelected){
        var aDataColumns = [];
        var oCheckBox = new sap.ui.commons.CheckBox({
            selected : false,
            text : "{i18n>BU_BUT_Download_Shown}",
            tooltip : "{i18n>BU_TOL_Download_Shown}",
            change : function(oEvent) {
                this._bSelectedColumns = oEvent.getParameter("checked");
            }.bind(this)
        });
        bSelected ? this._toolbar2.getItems()[4].destroy() : this._toolbar2.addItem(oCheckBox);

        var aPaths = this._oHeaderTable.getBinding("rows").aKeys;
        var aEmptyProperties = this.findEmptyProperties(aPaths);

        aPaths.forEach(function(item){
        var oPropertyValue = this._oHeaderTable.getBinding("rows").getModel().getProperty("/" + item);
            for(var i = 0; i < aEmptyProperties.length; i++){
                if(oPropertyValue[aEmptyProperties[i]]){
                    aDataColumns.push(aEmptyProperties[i]);
                    aEmptyProperties.splice(i, 1);
                }
            }
        }.bind(this));

    this.handleVisibleColumns(aDataColumns, bSelected, aEmptyProperties);
},

    findEmptyProperties : function(aKeys){
        for( var i = 0; i < aKeys.length; i++){
            var aProperties = [];
            var oProperty = this._oHeaderTable.getBinding("rows").getModel().getProperty("/" + aKeys[i]);
            for(var prop in oProperty){
                if (!oProperty[prop] && 
                                (this._aaVisibleColumns[prop] || this._aaVisibleColumns.hasOwnProperty(this._oInconsistentNames[prop]))){
                    aProperties.push(prop);
                }
            }
            if(aProperties.length > 0){
                 return aProperties;
            }
        }
    },

    handleVisibleColumns : function(aDataColumns, bSelected, aEmptyProperties){
        var aColumns = this._oHeaderTable.getColumns();
        aColumns.forEach(function(oCol){

            aEmptyProperties.find(function(x){
               if (oCol.sId === x || (this._oInconsistentNames[x] === oCol.sId)){   
                   oCol.setVisible(!bSelected);
                }
            }.bind(this));

            aDataColumns.find(function(m){
                oCol.sId === m ? oCol.setVisible(true) : false;    
            });

        }.bind(this));   
    },

    adaptParamsForCall : function(){
        var aVisibleColumns = this._oHeaderTable.getColumns().filter(function(oCol){
            return oCol.getVisible();
        });
        aVisibleColumns.forEach(function(oCol){
            this._aaVisibleColumns[oCol.sId] = true;
        }.bind(this));
    },

    getCurrentVisibleColumns : function(aBundle){
      return aBundle.aColumns.filter(function(oCol) {
            return this._aaVisibleColumns[oCol.id.split('-')[1]];
        }.bind(this));
    },
    // export in csv format, only visible columns are exported
    _downloadRecordsAsCSV : function(oEvent) {
        var aColumns = []; // columns are shown in table
        this._oHeaderTable.getColumns().forEach(function(oColumn) {
            if (oColumn.getVisible()) {
                aColumns.push(new sap.ui.core.util.ExportColumn({
                    name : oColumn.getLabel().getText(),
                    template : {
                        content : oColumn.getTemplate().getBindingInfo("text")
                    }
                }));
            }
        });

        this._oHeaderTable.exportData({
            exportType : new sap.ui.core.util.ExportTypeCSV({
                separatorChar : ";"
            }),
            columns : oEvent.getParameter("selected") ? aColumns : undefined
        }).saveFile().always(function() {
            this.destroy();
        });
    },

    // download log data as zipped file from server
    _downloadRecordsAsZIP : function(oEvent) {
        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oWorkspaceData = oWorkspaceModel.getData();

        var oSelectedColumns = {};
        this._oHeaderTable.getColumns().forEach(function(oCol){
            if(oCol.getVisible()){
                oSelectedColumns[oCol.sId] = true;
            }
        });
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
        oQuery.original = false;

        // add select field
        if (oEvent.getParameter("selected")) {
            oQuery.queryOptions = {
                select : Object.keys(oSelectedColumns)
            };
        }

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
        oRm.renderControl(oControl._layout2);
        oRm.write("</div>"); // end of the complete Control
    }
});
