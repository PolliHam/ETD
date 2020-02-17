/* globals oTextBundle, oCommonFunctions */
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.browse.Constants");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.browse.utils");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.secmon.ui.commons.Privileges");
sap.ui.define([ 'jquery.sap.global', 'sap/secmon/ui/m/commons/EtdController', 'sap/ui/model/Filter', 'sap/ui/model/Sorter', 'sap/ui/model/json/JSONModel' ], function(jQuery, Controller, JSONModel) {
    "use strict";

    var SnapshotPageListController =
            Controller.extend("sap.secmon.ui.snapshot.ui.SnapshotPageList", {

                onInit : function() {
                    var oUIModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(oUIModel, "UIModel");
                    this._setRefreshMode("onSnapshot");
                    this._getSnapshotPageList();
                    // Time Ranges List
                    var oTimeRangeModel = new sap.ui.model.json.JSONModel();
                    sap.ui.getCore().setModel(oTimeRangeModel, "TimeRangeModel");
                    this._loadTimeRanges();
                },

                onAfterRendering : function() {
                    this._processAddButtonsAvailability();
                },

                onNavBack : function() {
                    this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                        window.history.go(-1);
                    });
                },
                onHelpSSPress : function(oEvent) {
                    window.open("/sap/secmon/help/40fdd5b5cc2e41b08448f577f447ae84.html");
                },
                onHelpFLPress : function(oEvent) {
                    window.open("/sap/secmon/help/9d896aafcbf645479a8d1309bd8183f3.html");
                },
                _getSnapshotPageList : function(selectNew) {
                    var that = this;
                    // set up models
                    this.oSnapshotPageListModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/Snapshot.xsodata", {
                        json : true,
                        defaultCountMode : sap.ui.model.odata.CountMode.Inline
                    });
                    this.oSnapshotPageListModel.read("/Snapshot", {
                        urlParameters : [ "$orderby=CreatedAt desc" ],
                        success : function(oData, oResponse) {
                            var aResults = oData.results;
                            var aSnapshotPages = [];
                            var data = {
                                all : aResults,
                                snapshotPages : [],
                                selected : []
                            };
                            aResults.forEach(function(oResult, i) {
                                if (oResult.Type === "Snapshot") {
                                    aSnapshotPages.push(oResult);
                                }
                            });
                            // default model for data binding
                            var oModel = new sap.ui.model.json.JSONModel();
                            oModel.setData(data);
                            that.getView().setModel(oModel, "SnapshotPageList");
                            that.getView().getModel("SnapshotPageList").setProperty("/snapshotPages", aSnapshotPages);
                            that.getView().getModel("SnapshotPageList").refresh(true);
                            if (selectNew) {
                                that._selectNewCreatedSnapshotPage();
                            }
                        },
                        error : function() {
                            sap.ui.commons.MessageBox.show(oTextBundle.getText("SS_MSG_Error"), sap.ui.commons.MessageBox.Icon.ERROR, sap.ui.commons.MessageBox.Action.OK);
                        }
                    });
                },
                _processAddButtonsAvailability : function() {
                    var oChartUIModel = this.getView().getModel("ChartUIModel");
                    if (!oChartUIModel) {
                        return;
                    }                
                    if (this.getView().byId("snapshotTable").getSelectedItems().length > 0) {
                        oChartUIModel.setProperty("/addButtonsEnabled", true);
                        return;
                    }
                    oChartUIModel.setProperty("/addButtonsEnabled", false);
                },
                onSelectionChange : function(oEvent) {
                    var aAllItems = this.getView().getModel("SnapshotPageList");
                    var oList = this.getView().byId("snapshotTable");
                    var aSelectedItems = oList.getSelectedItems(), aSelected = [];

                    aSelectedItems.forEach(function(oSelectedItem) {
                        var id = aAllItems.getProperty(oSelectedItem.oBindingContexts.SnapshotPageList.sPath + "/Id");
                        aSelected.push(sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(id));
                    });
                    this.getView().getModel("SnapshotPageList").setProperty("/selected", aSelected);
                    this.getView().getModel("SnapshotPageList").refresh(true);
                    this._processAddButtonsAvailability();
                },
                enabledFormatter : function(aVal) {
                    return aVal.length > 0;
                },
                visibleButtonFormatter : function(bDeleteButtonVisible, bSnapshotWrite) {
                    return bDeleteButtonVisible && bSnapshotWrite;
                },
                onSearch : function(oEvent) {
                    // add filter for search
                    var sQuery = oEvent.getSource().getValue();
                    var table = this.getView().byId("snapshotTable");
                    var binding = table.getBinding("items");
                    if (!sQuery) {
                        binding.filter([]);
                    } else {
                        binding.filter([ new sap.ui.model.Filter(
                                [ new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery), new sap.ui.model.Filter("CreatedBy", sap.ui.model.FilterOperator.Contains, sQuery),
                                        new sap.ui.model.Filter("ChangedBy", sap.ui.model.FilterOperator.Contains, sQuery) ], false) ]);
                    }
                },
                handleSort : function(oEvent) {
                    var oParameters = oEvent.getParameters();
                    var oSortedColumn = oParameters.column;
                    var sortOrder = oParameters.sortOrder;
                    var oBinding = oEvent.getSource().getBinding("items");

                    var sSortProperty = oSortedColumn.getSortProperty();
                    var bSortDesc = (sortOrder === sap.secmon.ui.m.commons.controls.SortOrder.Descending);

                    oEvent.getSource().getColumns().forEach(function(oColumn) {
                        if (oColumn !== oSortedColumn) {
                            if (oColumn instanceof sap.secmon.ui.m.commons.controls.SortableColumn) {
                                oColumn.setSorted(false);
                            }
                        }
                    });
                    oSortedColumn.setSorted(true);
                    oSortedColumn.setSortOrder(sortOrder);

                    var oSorter = new sap.ui.model.Sorter(sSortProperty, bSortDesc);
                    oBinding.sort(oSorter);
                },
                onPressOpenSnapshot : function(oEvent) {
                    var oBindingContext = oEvent.getParameter("listItem").getBindingContext("SnapshotPageList");

                    var sId = oCommonFunctions.base64ToHex(oBindingContext.getProperty("Id"));
                    var bSnapshotRead = sap.secmon.ui.commons.Privileges.isAuthorized.call(this, "snapshotRead");
                    if (bSnapshotRead) {
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("snapshotDetail", {
                            "snapshotId" : sId
                        });
                    }
                    // var href = "/sap/secmon/ui/snapshot/?Id=" + sId + "";
                    // window.open(href, '_blank');
                },
                onDeletePress : function(oEvent) {
                    var that = this;
                    sap.m.MessageBox.confirm(oTextBundle.getText("SS_MSG_SPDelete"), {
                        title : "{i18n>SS_TIT_SPDelete}",
                        actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                        onClose : function(oAction) {
                            if (oAction === sap.m.MessageBox.Action.YES) {
                                that.fnDeleteSnapshotPage();
                            }
                        }
                    });
                },
                // multiple delete works
                fnDeleteSnapshotPage : function() {
                    var that = this;
                    var aAllItems = this.getView().getModel("SnapshotPageList");
                    var aSelectedItems = this.getView().byId("snapshotTable").getSelectedItems();
                    var sId;
                    var batchChanges = [];
                    // var oSnapshotPageListModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/Snapshot.xsodata");
                    this.oSnapshotPageListModel.setUseBatch(true);
                    aSelectedItems.forEach(function(oSelectedItem) {
                        var sParentId = aAllItems.getProperty(oSelectedItem.oBindingContexts.SnapshotPageList.sPath + "/ParentId");
                        // converting Id
                        sId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(sParentId);
                        batchChanges.push(that.oSnapshotPageListModel.createBatchOperation("/Snapshot(X'" + sId + "')", "DELETE"));
                    });

                    this.oSnapshotPageListModel.addBatchChangeOperations(batchChanges);

                    this.oSnapshotPageListModel.submitBatch(function(data) {
                        that._getSnapshotPageList();
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("SS_MSG_SPDeletedOK"));
                    }, function(error) {
                        sap.ui.commons.MessageBox.show(oTextBundle.getText("SS_MSG_PageIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle.getText("SS_TIT_Snapshot"),
                                sap.ui.commons.MessageBox.Action.OK);
                    });
                },
                _setRefreshMode : function(oMode) {
                    this.mode = oMode;
                    var oUIModelData = this.getView().getModel("UIModel").getData();
                    switch (this.mode) {
                    case 'none':
                    case 'onForensicLab':
                        oUIModelData.helpFLButVisible = true;
                        oUIModelData.helpSSButVisible = false;
                        oUIModelData.backButtonVisible = false;
                        oUIModelData.deleteButtonVisible = false;
                        oUIModelData.addButtonVisible = true;
                        oUIModelData.columnItemsType = "Inactive";
                        break;
                    case 'onSnapshot':
                        oUIModelData.helpFLButVisible = false;
                        oUIModelData.helpSSButVisible = true;
                        oUIModelData.backButtonVisible = true;
                        oUIModelData.deleteButtonVisible = true;
                        oUIModelData.addButtonVisible = false;
                        oUIModelData.columnItemsType = "Navigation";
                        break;
                    }
                    this.getView().getModel("UIModel").setData(oUIModelData);
                    // this.getView().getModel("UIModel").refresh(true);
                },
                _loadTimeRanges : function() {

                    var oQuery = {
                        operation : sap.secmon.ui.browse.Constants.C_SERVICE_OPERATION.GET_TIMERANGE_LIST,
                        requests : []
                    };
                    var promise = sap.secmon.ui.browse.utils.postJSon(sap.secmon.ui.browse.Constants.C_SERVICE_PATH, JSON.stringify(oQuery));
                    promise.done(function(response, textStatus, XMLHttpRequest) {
                        var oTimeRangeList = [];
                        for (var i = 0, maxLen = response.length; i < maxLen; i++) {
                            oTimeRangeList.push(response[i]);
                        }
                        sap.ui.getCore().getModel("TimeRangeModel").setData(oTimeRangeList);
                    });
                    promise.fail(function(jqXHR, textStatus, errorThrown) {
                        var messageText = jqXHR.status + ' ' + errorThrown + ': ' + jqXHR.responseText;
                        sap.secmon.ui.browse.utils.getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
                    });
                },

                _selectNewCreatedSnapshotPage : function() {
                    var oTable = this.getView().byId("snapshotTable");
                    var oTableItems = oTable.getItems();
                    oTable.setSelectedItem(oTableItems[0], true);
                    this.onSelectionChange();
                },

                onCreate : function(oEvent) {
                    var that = this;

                    if (!this._oSnapshotCreateDialog) {
                        var oDummyController =
                                {
                                    pressedOK : function(oEvent) {
                                        var value = oEvent.getSource().oParent.oParent.getContent()[0].getContent()[1].getValue();
                                        var sId = sap.secmon.ui.browse.utils.generateGUID();
                                        var oSnapshotPage = {
                                            Id : sId,
                                            ParentId : sId,
                                            Name : value,
                                            Type : "Snapshot"
                                        };
                                        oSnapshotPage.SerializedData = JSON.stringify(oSnapshotPage);
                                        oSnapshotPage.Id = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oSnapshotPage.Id);
                                        oSnapshotPage.ParentId = sap.secmon.ui.browse.utils.CommonFunctions.hexToBase64(oSnapshotPage.ParentId);
                                        /*
                                         * oModel->Data ->pages-->-->id -->-->name -->-->snapshots -->-->-->id, chartId, parentId, type, name
                                         */
                                        that.oSnapshotPageListModel.create("/Snapshot", oSnapshotPage, {
                                            success : function(oResult, oResponse) {
                                                that._getSnapshotPageList(true);
                                                new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("SS_MSG_SPSaveOK"));
                                            },
                                            error : function() {
                                                sap.ui.commons.MessageBox.show(oTextBundle.getText("SS_MSG_PageIdNotFound", sId), sap.ui.commons.MessageBox.Icon.ERROR, oTextBundle
                                                        .getText("SS_TIT_Snapshot"), sap.ui.commons.MessageBox.Action.OK);
                                            }
                                        });
                                        that._oSnapshotCreateDialog.close();
                                    },
                                    pressedCancel : function() {
                                        that._oSnapshotCreateDialog.close();
                                    }
                                };
                        this._oSnapshotCreateDialog = sap.ui.xmlfragment("sap.secmon.ui.snapshot.ui.SnapshotCreate", oDummyController);
                        this._oSnapshotCreateDialog.setModel(this.getView().getModel("applicationContext"), "applicationContext");
                        this._oSnapshotCreateDialog.setModel(this.getView().getModel("i18n"), "i18n");
                    }
                    this._oSnapshotCreateDialog.open();
                },

            });
    return SnapshotPageListController;

});