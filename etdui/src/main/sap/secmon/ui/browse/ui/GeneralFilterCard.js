/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.browse.GeneralFilterCard");

$.sap.require("sap.secmon.ui.browse.AbstractValueSelector");
$.sap.require("sap.secmon.ui.browse.MultiInput");
$.sap.require("sap.secmon.ui.browse.utils");
$.sap.require("sap.secmon.ui.browse.Constants");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.secmon.ui.browse.AbstractValueSelector.extend("sap.secmon.ui.browse.GeneralFilterCard", {

    metadata : {

        properties : {
            knowledgeBased : {
                type : "boolean",
                defaultValue : false,
            },
        },
        aggregations : {
            layout : {
                type : "sap.ui.commons.layout.MatrixLayout",
                multiple : false,
            },
        },

        events : {
            change : {
                newValue : undefined
            },
        }
    },

    _oListBox : undefined,
    layout : undefined,

    MAX_VALUE_ALLOWED : 512,
    SOURCE_KNOWLEDGE_BASE : "KnowledgeBase",
    SOURCE_LOGS : "Logs",
    
    _filterValues : function(oEvent) {

        var aFilters = [];
        var sQuery = oEvent.getParameters().newValue;
        if (sQuery && sQuery.length > 0) {
            var filter = new sap.ui.model.Filter("value", sap.ui.model.FilterOperator.Contains, sQuery);
            aFilters.push(filter);
        }

        // update list binding
        oEvent.getSource().getBinding("items").filter(aFilters);
    },

    _switchValueSelector : function() {
        var aSearchTerms;
        var that = this;

        for (var i = this.layout.getRows().length - 1; i > 1; i--) {
            this.layout.removeRow(i);
        }

        var oValueSelectorRow = new sap.ui.commons.layout.MatrixLayoutRow();

        var oSelectedFilterModel = sap.ui.getCore().getModel("SelectedFilterModel");
        var selectedOperator = oSelectedFilterModel.getProperty("/valueRange/operator");

        switch (selectedOperator) {
        case undefined:
        case "":
        case ">":
        case "<":
        case ">=":
        case "<=":
        case "=":
        case "LIKE_REGEXPR":
        case "LIKE":
            // clear up search terms -> keeping only the first
            aSearchTerms = oSelectedFilterModel.getData().valueRange.searchTerms;
            aSearchTerms.splice(1, aSearchTerms.length - 1);

            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell().addContent(new sap.m.Label({
                text : "{i18n>BU_LBL_Value}"
            })));
            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
            }).addContent(new sap.ui.commons.AutoComplete({
                // enableListSuggest : true,
                value : {
                    path : "SelectedFilterModel>/valueRange/searchTerms/0",
                },
                items : {
                    path : "ValueHelpModel>/data",
                    template : new sap.ui.core.ListItem({
                        key : "{ValueHelpModel>value}",
                        text : "{ValueHelpModel>value}"
                    })
                },
                startSuggestion : 0,
                liveChange : [ function(oEvent) {
                    this._filterValues(oEvent);
                }, this ],
                maxLength : sap.secmon.ui.browse.Constants.C_FILTER_VALUE.MAX_LENGTH,
                enabled : true
            })));
            this.layout.addRow(oValueSelectorRow);
            break;

        case "IS NULL":
            oSelectedFilterModel.getData().valueRange.searchTerms = [ null ];
            break;

        case "BETWEEN":
            // clear up search terms -> keeping only the first and second
            aSearchTerms = oSelectedFilterModel.getData().valueRange.searchTerms;
            aSearchTerms.splice(1, aSearchTerms.length - 2);

            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell().addContent(new sap.m.Label({
                text : "{i18n>BU_LBL_From}"
            })));
            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
            }).addContent(new sap.ui.commons.AutoComplete({
                // enableListSuggest : true,
                value : {
                    path : "SelectedFilterModel>/valueRange/searchTerms/0",
                },
                items : {
                    path : "ValueHelpModel>/data",
                    template : new sap.ui.core.ListItem({
                        text : "{ValueHelpModel>value}"
                    })
                },
                startSuggestion : 0,
                liveChange : [ function(oEvent) {
                    this._filterValues(oEvent);
                }, this ],
                enabled : true
            })));
            this.layout.addRow(oValueSelectorRow);

            var oValueSelectorRow2 = new sap.ui.commons.layout.MatrixLayoutRow();
            oValueSelectorRow2.addCell(new sap.ui.commons.layout.MatrixLayoutCell().addContent(new sap.m.Label({
                text : "{i18n>BU_LBL_To}"
            })));
            oValueSelectorRow2.addCell(new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
            }).addContent(new sap.ui.commons.AutoComplete({
                // enableListSuggest : true,
                value : {
                    path : "SelectedFilterModel>/valueRange/searchTerms/1",
                },
                items : {
                    path : "ValueHelpModel>/data",
                    template : new sap.ui.core.ListItem({
                        text : "{ValueHelpModel>value}"
                    })
                },
                startSuggestion : 0,
                liveChange : [ function(oEvent) {
                    this._filterValues(oEvent);
                }, this ],
                enabled : true
            })));
            this.layout.addRow(oValueSelectorRow2);
            break;
        case "IN":
            this._oListBox = new sap.secmon.ui.browse.MultiInput({
                tokens : {
                    path : "/valueRange/searchTerms",
                    template : new sap.m.Token({
                        text : {
                            path : "",
                            formatter : function(sKey) {
                                return sKey === null ? sap.secmon.ui.browse.Constants.C_VALUE.NULL : sKey;
                            }
                        },
                        key : "{}",
                        "delete" : function(oEvent) {
                            var oToken = oEvent.getSource();
                            var aSearchTerms = that.getModel().getProperty("/valueRange/searchTerms");
                            var iIdx = aSearchTerms.indexOf(oToken.getKey());
                            if (iIdx >= 0) {
                                aSearchTerms.splice(iIdx, 1);
                                that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                                that.getModel().refresh(true);
                            }
                        }
                    }),
                },
                suggestionItems : {
                    path : "ValueHelpModel>/data",
                    template : new sap.ui.core.Item({
                        key : "{ValueHelpModel>value}",
                        text : {
                            path : "ValueHelpModel>value",
                            formatter : function(value) {
                                return (value === null ? sap.secmon.ui.browse.Constants.C_VALUE.NULL : value);
                            }
                        }
                    })
                },
                valueHelpUpdated : function(oEvent) {
                    var aSearchTerms = [];

                    oEvent.getParameter("selectedItems").forEach(function(oItem) {
                        aSearchTerms.push(oItem.key);
                    });
                    that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                    that.getModel().refresh(true);
                },
                suggestionItemSelected : [ function(oEvent) {
                    var oToken = oEvent.getParameter("selectedItem");
                    var aSearchTerms = that.getModel().getProperty("/valueRange/searchTerms");

                    // do not insert if already in the searchterms
                    for (var i = 0; i < aSearchTerms.length; i++) {
                        if (aSearchTerms[i] === oToken.getKey()) {
                            return;
                        }
                    }
                    aSearchTerms.push(oToken.getKey());
                    that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                    that.getModel().refresh(true);
                }, this ],

            }).addDelegate({ // reload the ValueHelpModel
                onAfterRendering : function() {
                    that._getFilterValues(that.getKnowledgeBased());
                },
            });

            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell().addContent(new sap.m.Label({
                text : "{i18n>BU_LBL_Value}"
            })));
            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
            }).addContent(this._oListBox));
            this.layout.addRow(oValueSelectorRow);

            break;

        case "IN VALUE LIST":
            this._oListBox = new sap.secmon.ui.browse.MultiInput({
                tokens : {
                    path : "/valueRange/searchTerms",
                    template : new sap.m.Token({
                        text : "{value}",
                        key : "{key}",
                        tooltip : "{tooltip}",
                        "delete" : function(oEvent) {
                            var oToken = oEvent.getSource();
                            var aSearchTerms = that.getModel().getProperty("/valueRange/searchTerms");
                            var iIdx = aSearchTerms.findIndex(function(oElm) {
                                return oElm.key === oToken.getKey();
                            });
                            if (iIdx >= 0) {
                                aSearchTerms.splice(iIdx, 1);
                                that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                                that.getModel().refresh(true);
                            }
                        }
                    }),
                },
                valueHelpUpdated : function(oEvent) {
                    var aSearchTerms = [];

                    oEvent.getParameter("selectedItems").forEach(function(oItem) {
                        aSearchTerms.push({
                            key : oItem.key,
                            value : oItem.text.substring(0, oItem.text.indexOf("{") - 1),
                            tooltip : oItem.tooltip
                        });
                    });
                    that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                    that.getModel().refresh(true);
                },
                suggestionItems : {
                    path : "ValueListModel>/Header", // "ValueListModel>/",
                    sorter : new sap.ui.model.Sorter("ListName"),
                    template : new sap.ui.core.ListItem({
                        key : {
                            path : "ValueListModel>Id",
                            formatter : function(sId) {
                                return sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(sId);
                            }
                        },
                        text : {
                            parts : [ {
                                path : 'ValueListModel>ListName'
                            }, {
                                path : 'ValueListModel>NameSpace'
                            } ],
                            formatter : function(listName, nameSpace) {
                                return listName + " {" + nameSpace + "}";
                            }
                        },
                        tooltip : {
                            parts : [ {
                                path : 'ValueListModel>Description'
                            }, {
                                path : 'ValueListModel>NameSpace'
                            } ],
                            formatter : function(description, nameSpace) {
                                return description + " {" + nameSpace + "}";
                            }
                        }

                    })
                },
                suggestionItemSelected : [ function(oEvent) {
                    var oToken = oEvent.getParameter("selectedItem");
                    var aSearchTerms = that.getModel().getProperty("/valueRange/searchTerms");

                    // another way to avoid duplicates
                    if (!function() {
                        var bFound = false;
                        aSearchTerms.some(function(oSearchTerm, i) {
                            if (oSearchTerm.key === oToken.getKey()) {
                                bFound = true;
                                return true;
                            }
                        });
                        return bFound;
                    }()) {
                        aSearchTerms.push({
                            key : oToken.getKey(),
                            value : oToken.getText().substring(0, oToken.getText().indexOf("{") - 1)
                        });
                        that.getModel().setProperty("/valueRange/searchTerms", aSearchTerms);
                        that.getModel().refresh(true);
                    }
                }, this ],

            }).addDelegate({ // reload the ValueHelpModel
                onAfterRendering : function() {
                    that._getFilterValues(that.getKnowledgeBased());
                },
            });

            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell().addContent(new sap.m.Label({
                text : "{i18n>BU_LBL_Value}"
            })));
            oValueSelectorRow.addCell(new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
            }).addContent(this._oListBox));
            this.layout.addRow(oValueSelectorRow);

            break;
        }

    },

    init : function() {
        // call the init() of our super control
        if (sap.secmon.ui.browse.AbstractValueSelector.prototype.init) {
            sap.secmon.ui.browse.AbstractValueSelector.prototype.init.call(this);
        }

        if (sap.secmon.ui.browse.AbstractValueSelector.prototype._registerFilterCardCloseEvent) {
            sap.secmon.ui.browse.AbstractValueSelector.prototype._registerFilterCardCloseEvent.call(this);
        }

        // fetch the layout control from the AbstractValueSelector (inherited)
        this.layout = sap.secmon.ui.browse.AbstractValueSelector.prototype.getAggregation.call(this, "layout");

        var oValueListModel = new sap.ui.model.odata.ODataModel(sap.secmon.ui.browse.Constants.C_ODATA_VALUE_LISTS_PATH, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oValueListModel, 'ValueListModel');

        var oSelectedFilterModel = sap.ui.getCore().getModel('SelectedFilterModel');
        var oSelectedFilterData = oSelectedFilterModel.getData();
        if (oSelectedFilterData.dataType === 'ValueVarChar') {
            var bExists = false;
            $.each(oSelectedFilterData.filterOperators, function(index, sOperator) {
                if (sOperator === 'IN VALUE LIST') {
                    bExists = true;
                    return false;
                }
            });
            if (!bExists) {
                oSelectedFilterData.filterOperators.push('IN VALUE LIST');
            }
        }

        if (oSelectedFilterModel.getProperty("/valueRange") === undefined) {
            oSelectedFilterData.valueRange = {
                operator : oSelectedFilterModel.getProperty("/filterOperators/0")
            };
            oSelectedFilterModel.setData(oSelectedFilterData);
        }
        this.setModel(oSelectedFilterModel);

        var oValueHelpModel = new sap.ui.model.json.JSONModel();
        oValueHelpModel.setSizeLimit(sap.secmon.ui.browse.Constants.C_MODEL_SIZE_LIMIT.VALUE_LIST);

        this.setModel(oValueHelpModel, "ValueHelpModel");

        var oOperator = new sap.ui.commons.DropdownBox({
            selectedKey : "{/valueRange/operator}",
            items : {
                path : "/filterOperators",
                template : new sap.ui.core.ListItem({
                    key : "{}",
                    text : "{}"
                })
            },
            change : [ function(oEvent) {
                var oItem = oEvent.getParameters().selectedItem;
                var oBindingContext = oItem.getBindingContext();
                var oSelectedFilterModel = oEvent.getSource().getModel();
                var oData = oSelectedFilterModel.getProperty(oBindingContext.getPath());
                oSelectedFilterModel.setProperty("/valueRange/operator", oData);

                this._switchValueSelector();
            }, this ],

        });

        var oEnumReadSwitch = new sap.ui.commons.RadioButtonGroup({
            enabled : "{/isEnumeration}",
            columns : 2,
            select : [ function(oEvent) {
                var oSelectedFilterModel = oEvent.getSource().getModel();
                // initialize the ValueHelp with Distinct Values
                if (oEvent.getSource().getSelectedIndex() === 1) {
                    oSelectedFilterModel.setProperty("/source", this.SOURCE_KNOWLEDGE_BASE);
                    this._getFilterValues(true); // from Knowledge Base
                    return;
                } 
                oSelectedFilterModel.setProperty("/source", this.SOURCE_LOGS);
                this._getFilterValues(false); // from Logs

            }, this ],
            selectedIndex : oSelectedFilterModel.getProperty("/source") === this.SOURCE_KNOWLEDGE_BASE ? 1 : 0,
            items : [ new sap.ui.core.Item({
                text : oTextBundle.getText("BU_RB_LBL_EnumSourceLogs"),
                tooltip : oTextBundle.getText("BU_RB_TOL_EnumSourceLogs")
            }), new sap.ui.core.Item({
                text : oTextBundle.getText("BU_RB_LBL_EnumSourceKB"),
                tooltip : oTextBundle.getText("BU_RB_TOL_EnumSourceKB")
            }) ]
        });

        var aLayoutRows = this.layout.getRows();

        for (var i = aLayoutRows.length - 1; i > 2; i--) {
            this.layout.removeRow(i);
        }

        // TODO; clear the Matrix
        // this.layout.removeAllRows();

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_Operator}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oOperator
            }) ]
        }));

        this.layout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : new sap.ui.commons.Label({
                    text : "{i18n>BU_LBL_EnumSource}",
                })
            }), new sap.ui.commons.layout.MatrixLayoutCell({
                colSpan : 2,
                content : oEnumReadSwitch
            }) ]
        }));

        this._switchValueSelector();
    },

    // initialize the ValueHelp with Distinct Values
    _getFilterValues : function(bRequestEnum) {

        var that = this;

        var oWorkspaceModel = sap.ui.getCore().getModel('WorkspaceModel');
        var oWorkspaceData = oWorkspaceModel.getData();

        var oSelectedFilterModel = sap.ui.getCore().getModel("SelectedFilterModel");
        var oSelectedFilterData = oSelectedFilterModel.getData();

        var aBuf = oSelectedFilterData.workspaceContext.split(".");
        var aPath = aBuf[0].split("Path");
        var sPathLuid = aPath[1];

        var iPathIdx = parseInt(sap.secmon.ui.browse.utils.getPathIdxByLuid(sPathLuid, oWorkspaceData));
        var sSubsetIdx = sap.secmon.ui.browse.utils.getSubsetIdxByLuid(oSelectedFilterData.luid, iPathIdx, oWorkspaceData);
        var sSubsetLuid = 0;

        if (sSubsetIdx === undefined) { // MODE = NEW
            var iLastSubsetIdx = (oWorkspaceData.paths[iPathIdx].filters.length) - 1;
            if (iLastSubsetIdx >= 0) {
                sSubsetLuid = oWorkspaceData.paths[iPathIdx].filters[iLastSubsetIdx].luid;
            }
        } else { // MODE = EDIT
            if (sSubsetIdx > 0) {
                sSubsetLuid = oWorkspaceData.paths[iPathIdx].filters[sSubsetIdx - 1].luid;
            }
        }

        var sStartSubset = "Path" + sPathLuid + ".Subset" + sSubsetLuid;

        // Distinguish two cases In and InValue List
        // operator = IN -> searchTerm["abc", "s23"]
        // IN Value List -> searchTerm[{key: "sss", value: "evets der"},
        // {...}]
        var sOperator = oSelectedFilterModel.getProperty("/valueRange/operator");
        if (sOperator === "IN VALUE LIST") {
            // var oValueListModel =
            // sap.ui.getCore().getModel("ValueListModel");
            var oValueListModel = this.getModel("ValueListModel");
            oValueListModel.read("/Header", {
                urlParameters : [ "$format=json" ],
                sorter : new sap.ui.model.Sorter("ListName"),
                success : function(oData, oResponse) {
                    if (that._oListBox) {
                        var aSelKeys = [];
                        var aValueList = JSON.parse(oResponse.body).d.results;
                        var ivLen = aValueList.length;
                        var aSearchTerms = oSelectedFilterModel.getObject("/valueRange/searchTerms");
                        var isLen = aSearchTerms.length;
                        for (var i = 0; i < ivLen; i++) {
                            for (var j = 0; j < isLen; j++) {
                                if (aValueList[i].Id === sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(aSearchTerms[j].key)) {
                                    aSelKeys.push(aValueList[i].Id);
                                    break;
                                }
                            }
                        }
                        // that._oListBox.setSelectedKeys(aSelKeys);
                    }
                },
                error : function(oError) {
                    console.error(oError);
                }
            });

        } else {
            var oDimension = {};
            oDimension.key = oSelectedFilterData.key;
            oDimension.distinct = true;
            oDimension.roleIndependent =  Object.keys(sap.secmon.ui.browse.Constants.C_ROLE_INDEPENDENT_ATTRIBUTES).indexOf(oSelectedFilterData.key) > -1;
            var aDimension = [];
            aDimension.push(oDimension);
            var oCurrModelDataCpy = $.extend(true, {}, oWorkspaceData);
            var oQuery = sap.secmon.ui.browse.utils.mapUI2Query(sStartSubset, oCurrModelDataCpy, sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_FILTER_VALUES, aDimension, null, bRequestEnum);
            oQuery.verbose = sap.secmon.ui.browse.utils.getController().bDebug;

            // load log event from warm storage, but only for log event, not for alerts, configchecks and
            // TODO
            oQuery.forceWarm = sap.secmon.ui.browse.utils.getController()._bForceWarm;

            var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));

            promise.done(function(response, textStatus, XMLHttpRequest) {
                var oValueHelpModel = that.getModel("ValueHelpModel");
                oValueHelpModel.setData(response);

            });

            promise.fail(function(jqXHR, textStatus, errorThrown) {
                var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            });
        }
    },

    onBeforeRendering : function() {
    },

    renderer : sap.secmon.ui.browse.AbstractValueSelectorRenderer,

});
