/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.FilterCard");

$.sap.require("sap.secmon.ui.browse.AbstractValueSelector");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.commons.Formatter");

var _oCurrentSelector;

sap.ui.core.Control.extend("sap.secmon.ui.browse.FilterCard", {

    _oSelectedFilter : {},
    _oAvailableFiltersModel : {},
    _oFieldSearch : {},
    _oAbstractValueSelector : undefined,
    _oCache : undefined,

    MODE_NEW : "NEW",
    MODE_EDIT : "EDIT",

    metadata : {
        properties : {
            title : {
                type : "string",
                defaultValue : "{i18n>BU_TIT_SelFilter}"
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
            },
            "mode" : {
                type : "string",
                defaultValue : this.MODE_NEW,
            },
            "pathIndex" : {
                type : "string"
            },
            "subsetIndex" : {
                type : "string"
            },
            "_searchTerms" : {
                type : "any",
                defaultValue : [],
            }

        },
        aggregations : {
            _layout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
                visibility : "hidden"
            }
        },

        events : {
            fieldSelected : {},
            fieldSourceSelected : {},
            validationOK : {}
        }
    },

    setPathIndex : function(value) {

        this.setProperty("pathIndex", value);
        this._initSelectedFilterModel();
    },

    setSubsetIndex : function(value) {

        this.setProperty("subsetIndex", value);
        this._initSelectedFilterModel();
    },

    setMode : function(value) {

        this.setProperty("mode", value);
        this._initSelectedFilterModel();
    },

    exit : function() {
        if (this._oAvailableFiltersModel) {
            this._oAvailableFiltersModel.destroy();
            delete this._oAvailableFiltersModel;
        }
    },

    _initSelectedFilterModel : function() {

        if (this.getPathIndex() !== undefined && this.getSubsetIndex() !== undefined && this.getMode() !== undefined) {

            var thisControl = this;

            var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
            var oWorkspaceData = oWorkspaceModel.getData();

            var oSelectedFilterData = this._oSelectedFilterModel.getData();
            var sContext = oWorkspaceData.paths[this.getPathIndex()].context || oWorkspaceData.context;
            var sStartSubset = "";
            var sKey = "";

            if (this.getMode() === this.MODE_NEW) {

                var sNewSubsetLuid = sap.secmon.ui.browse.utils.generateLuid(oWorkspaceData.paths[thisControl.getPathIndex()].filters);

                oSelectedFilterData.workspaceContext = 'Path' + oWorkspaceData.paths[thisControl.getPathIndex()].luid + '.Subset' + sNewSubsetLuid;
                oSelectedFilterData.luid = sNewSubsetLuid;
                oSelectedFilterData.context = sContext;
                oSelectedFilterData.key = "";
                oSelectedFilterData.displayName = "";
                oSelectedFilterData.description = "";
                oSelectedFilterData.dataType = "";
                oSelectedFilterData.filterOperators = [];
                oSelectedFilterData.isFieldRef = 0;
                oSelectedFilterData.valueRange = {};
                oSelectedFilterData.valueRange.operator = "";
                oSelectedFilterData.valueRange.searchTerms = [];
                oSelectedFilterData.valueRange.searchTermRefKeys = [];
                oSelectedFilterData.count = oTextBundle.getText("BrowseCountLoading");
                this._oSelectedFilterModel.setData(oSelectedFilterData);

                // the current Subset is not part of this Query =>
                // startIdx = [idxSubset - 1]

                var sPathLuid = oWorkspaceData.paths[thisControl.getPathIndex()].luid;
                var iLastSubsetIdx = (oWorkspaceData.paths[thisControl.getPathIndex()].filters.length) - 1;
                sStartSubset = "Path" + sPathLuid;
                if (iLastSubsetIdx >= 0) {
                    var sSubsetLuid = oWorkspaceData.paths[thisControl.getPathIndex()].filters[iLastSubsetIdx].luid;
                    sStartSubset = sStartSubset + ".Subset" + sSubsetLuid;
                }

            } else if (this.getMode() === this.MODE_EDIT) {
                var oCurrFilter = oWorkspaceData.paths[parseInt(this.getPathIndex())].filters[parseInt(this.getSubsetIndex())];
                oCurrFilter.context = sContext;
                var sSelectedFilter = JSON.stringify(oCurrFilter);
                this._oSelectedFilterModel.setData(JSON.parse(sSelectedFilter));

                sStartSubset = oCurrFilter.workspaceContext;
                sKey = oCurrFilter.key;
            }

            thisControl.setBusy(true);
            var promise = sap.secmon.ui.browse.utils.getController()._oCache.getData([ {
                context : sContext,
                subsetId : sStartSubset
            } ], oWorkspaceData);

            promise.done(function(response, textStatus, XMLHttpRequest) {
                // new
                var oAvailableFiltersModel = sap.ui.getCore().getModel('AvailableFiltersModel');
                var oData = {};
                oData[sContext] = response.data;

                // sort the list
                oData[sContext] = sap.secmon.ui.browse.utils.sortFieldList(oData[sContext]);

                oAvailableFiltersModel.setData(oData);

                if (sKey === "") {
                    thisControl._updateFieldMetadata(oAvailableFiltersModel.getProperty("/" + sContext + "/0"));
                } else {
                    thisControl._updateFieldMetadata(thisControl._oAbstractValueSelector.getDataByKey(sKey, sContext, oAvailableFiltersModel));
                }
            });
            promise.fail(function(jqXHR, textStatus, errorThrown) {
                var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            });
            promise.always(function() {
                thisControl.setBusy(false);
            });
        }
    },

    _updateFieldMetadata : function(oMetadata) {

        var oSelectedFilterData = this._oSelectedFilterModel.getData();

        $.extend(true, oSelectedFilterData, oMetadata);
        oSelectedFilterData.filterOperators = JSON.parse(JSON.stringify(oMetadata.filterOperators));

        this._oSelectedFilterModel.setData(oSelectedFilterData);

        this._embedValueSelector();
    },

    _buildUI : function() {

        var that = this;

        var oWorkspaceContext = new sap.m.Label({
            text : "{SelectedFilterModel>/workspaceContext}"
        });
        oWorkspaceContext.setModel(this._oSelectedFilterModel, "SelectedFilterModel");

        // SelectedFilterModel : {context:"Log", key: "xxxxx"}
        // AvailableFiltersModel : { "Log": {data: [...]}}
        this._oFieldSearch = new sap.m.ComboBox({
            tooltip : "{i18n>BU_Field_ToolTip}",
            placeholder : "{i18n>BU_Field_Placeholder}",
            // displaySecondaryValues : true,
            selectionChange : [ function(oEvent) {
                var oSelectedItem = oEvent.getParameters().selectedItem;
                if (oSelectedItem) {
                    var sPath = oSelectedItem.oBindingContexts.AvailableFiltersModel.sPath;
                    // clear the value on field change in case of no reference
                    if (!this._oSelectedFilterModel.getProperty("/isFieldRef")) {
                        this._oSelectedFilterModel.setProperty("/valueRange/searchTerms", []);
                        if (this._oSelectedFilterModel.getProperty("/dataType") === sap.secmon.ui.browse.Constants.C_DATA_TYPE.TIMESTAMP) {
                            this._oSelectedFilterModel.setProperty("/valueRange/operator", this._oSelectedFilterModel.getProperty("/filterOperators/0"));
                        }
                    }

                    this._updateFieldMetadata(this._oAvailableFiltersModel.getProperty(sPath));
                }
            }, this ]
        });
        // add help link
        var oHelp = new sap.ui.core.Icon({
            src : "sap-icon://sys-help-2",
            size : "1.5em",
            width : "1.5em",
            color : "grey",
            hoverColor : "black",
            hoverBackgroundColor : "#009de0",
            visible : {
                path : "SelectedFilterModel>/context",
                formatter : function(value) {
                    return value === "Log";
                }
            },
            press : [ function(oEvent) {
                window.open("/sap/secmon/help/bcc4b5204b4b4115a73b84acd4eb25af.html");
            }, this ]
        });

        this._oFieldSearch.setModel(this._oSelectedFilterModel, "SelectedFilterModel");
        this._oFieldSearch.setModel(this._oAvailableFiltersModel, "AvailableFiltersModel");

        var oExcluded = new sap.m.CheckBox({
            text : "{i18n>BU_LBL_Excluded}",
            tooltip : "{i18n>BU_TOL_Excluded}",
            selected : "{SelectedFilterModel>/valueRange/exclude}",
            enabled : {
                path : "SelectedFilterModel>/isFieldRef",
                formatter : function(value) {
                    return value === 0;
                }
            },
            select : [ function() {
                if (oExcluded.getSelected()) {
                    this._oSelectedFilterModel.setProperty("/valueRange/exclude", true);
                } else {
                    this._oSelectedFilterModel.setProperty("/valueRange/exclude", false);
                }
            }, this ]
        });

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oFieldReference =
                new sap.m.RadioButtonGroup({
                    enabled : {
                        path : "WorkspaceModel>/paths",
                        formatter : function(aVals) {
                            var bEnabled = false;
                            var sWorkspaceContext = that._oSelectedFilterModel.getProperty("/workspaceContext");

                            var sCurrPathLuid = "";
                            if (sWorkspaceContext && sWorkspaceContext.length > 0) {
                                sCurrPathLuid = sWorkspaceContext.split("Path")[1].split(".")[0];
                                var iCurrPathIndex = sap.secmon.ui.browse.utils.getPathIdxByLuid(sCurrPathLuid, oWorkspaceModel.getData());
                                if (aVals.length > 1) {
                                    for (var i = 0; i < aVals.length; i++) {
                                        if (i !== iCurrPathIndex) {
                                            if (aVals[i].filters.length > 0) {
                                                bEnabled = true;
                                                break;
                                            }
                                        }
                                    }
                                }
                            }

                            return bEnabled;
                        }
                    },
                    columns : 2,
                    select : [
                            function(oEvent) {
                                var oOldVR = this._oSelectedFilterModel.getProperty("/oldValueRange/");
                                var oVR = JSON.parse(JSON.stringify(this._oSelectedFilterModel.getProperty("/valueRange/")));
                                if (oOldVR) {
                                    oOldVR = JSON.parse(JSON.stringify(oOldVR));
                                    this._oSelectedFilterModel.setProperty("/valueRange/", oOldVR);
                                } else {
                                    this._oSelectedFilterModel.setProperty("/valueRange/searchTerms", []);
                                    this._oSelectedFilterModel.setProperty("/valueRange/searchTermRefKeys", []);
                                }
                                this._oSelectedFilterModel.setProperty("/oldValueRange/", oVR);
                                this._updateFieldMetadata(this._oAbstractValueSelector.getDataByKey(this._oFieldSearch.getSelectedKey(), this._oSelectedFilterModel.getProperty("/context"),
                                        this._oAvailableFiltersModel));
                                // this._embedValueSelector();
                                // oExcluded checkbox enablility
                                var oCheckBox = oEvent.getSource().getParent().getParent().getParent().getRows()[2].getCells()[1].getContent()[0];
                                if (oEvent.getParameters().selectedIndex === 1) {
                                    oCheckBox.setEnabled(false);
                                    this._oSelectedFilterModel.setProperty("/valueRange/exclude", false);
                                } else if (oEvent.getParameters().selectedIndex === 0) {
                                    oCheckBox.setEnabled(true);
                                }
                            }, this ],
                    selectedIndex : "{SelectedFilterModel>/isFieldRef}",
                    buttons : [ new sap.m.RadioButton({
                        text : oTextBundle.getText("BU_RB_LBL_Value"),
                        tooltip : oTextBundle.getText("BU_RB_TOL_Value")
                    }), new sap.m.RadioButton({
                        text : oTextBundle.getText("BU_RB_LBL_Reference"),
                        tooltip : oTextBundle.getText("BU_RB_TOL_Reference")
                    }) ]
                // items : [ new sap.ui.core.Item({
                // text : oTextBundle.getText("BU_RB_LBL_Value"),
                // tooltip : oTextBundle.getText("BU_RB_TOL_Value")
                // }), new sap.ui.core.Item({
                // text : oTextBundle.getText("BU_RB_LBL_Reference"),
                // tooltip : oTextBundle.getText("BU_RB_TOL_Reference")
                // }) ]
                });

        oFieldReference.setModel(this._oSelectedFilterModel, "SelectedFilterModel");

        this._layout = new sap.ui.commons.layout.MatrixLayout({
            columns : 3
        });

        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_LBL_Context}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oWorkspaceContext
            }) ]
        }));

        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.m.Label({
                    text : "{i18n>BU_Field_Label}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : [ this._oFieldSearch, new sap.m.Label({
                    text : "",
                    width : "5px"
                }), oHelp ]
            }) ]
        }));

        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : null
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oExcluded
            }) ]
        }));

        this._layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : null
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oFieldReference
            }) ]
        }));

        this.setAggregation("_layout", this._layout);

    },

    validateValues : function() {
        _oCurrentSelector.fireValidateValues();
    },

    init : function() {

        this._oSelectedFilterModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(this._oSelectedFilterModel, "SelectedFilterModel");

        this._oAvailableFiltersModel = sap.ui.getCore().getModel('AvailableFiltersModel');

        if (!this._oAbstractValueSelector) {
            this._oAbstractValueSelector = new sap.secmon.ui.browse.AbstractValueSelector({});
            this._oAbstractValueSelector.setModel(sap.secmon.ui.browse.utils.getView().getModel("applicationContext"), "applicationContext");
        }

        this._buildUI();
    },

    renderer : function(oRm, oControl) {
        oRm.write("<div");
        oRm.writeControlData(oControl);
        oRm.writeClasses();
        oRm.write(">");
        oRm.renderControl(oControl._layout);
        oRm.write("</div>");
    },

    _embedValueSelector : function() {

        var oSelectedFilterData = this._oSelectedFilterModel.getData();

        // clear up until there exist 4 rows
        while (this._layout.getRows().length > 4) {
            this._layout.removeRow(this._layout.getRows().length - 1);
        }

        _oCurrentSelector = this._oAbstractValueSelector.createSelector(oSelectedFilterData, this._layout);
    },

    onBeforeRendering : function() {

        // reset the correct binding for items
        this._oFieldSearch.unbindItems();

        var aFields = [];
        this._oAvailableFiltersModel = sap.ui.getCore().getModel('AvailableFiltersModel');
        if (this._oSelectedFilterModel.getData().context === "Log") {
            var aFieldsData = this._oAvailableFiltersModel.getProperty("/Log");
            var bResolveUser = this.getModel("applicationContext").getProperty("/userPrivileges/originalLogRead");
            var bPlainUser = this.getModel("applicationContext").getProperty("/userPrivileges/plainUser");
            var aAttrConstantsKeys = [];
            
            // Show "Username <Role> attributes" field only if according Authorization exists
            if (!bPlainUser) {
                for (var oProp in sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES) {
                    aAttrConstantsKeys.push(sap.secmon.ui.browse.Constants.C_USERNAME_ATTRIBUTES[oProp].key);
                }
                if(aFieldsData){
                    aFields = aFieldsData.filter(function(oItem) {
                        if (aAttrConstantsKeys.indexOf(oItem.key) === -1) {
                            return oItem;
                        }
                    }.bind(this));
                }
                
            } else {
                aFields = aFieldsData;
            }

            // Show "Event, Original Data" field only if according Authorization exists
            if (!bResolveUser) {
                var iToDelete;
                (aFields || []).some(function(dim, i) {
                    // key for "Event,Original Message"
                    if (dim.key === '566CDFB06EFAAC24E10000000A4CF109') {
                        iToDelete = i;
                        return true;
                    }
                });

                if (iToDelete) {
                    aFields.splice(iToDelete, 1);
                }
            }

            this._oAvailableFiltersModel.setProperty("/Log", aFields);
        }

        this._oFieldSearch.bindAggregation("items", "AvailableFiltersModel>/" + this._oSelectedFilterModel.getData().context, new sap.ui.core.ListItem({
            key : "{AvailableFiltersModel>key}",
            text : { 
                    path: "AvailableFiltersModel>displayName",
                    formatter : function(sDisplayName){
                      return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDisplayName, sDisplayName);
                    }
                },
            tooltip : {
                path: "AvailableFiltersModel>description",
                formatter : function(sDescription){
                    return sap.secmon.ui.commons.Formatter.knowledgebaseFormatter.call(this, sDescription, sDescription);
                  }
            }
        }));

        this._oFieldSearch.setSelectedKey(sap.ui.getCore().getModel("SelectedFilterModel").getProperty("/key"));

        this._layout.setWidth(this.getWidth());
        // if (this.getMode() === this.MODE_NEW) {
        // this._oFieldSearch.setEnabled(true);
        // } else if (this.getMode() === this.MODE_EDIT) {
        // this._oFieldSearch.setEnabled(false);
        // }
    },

    onAfterRendering : function() {
    }

});
