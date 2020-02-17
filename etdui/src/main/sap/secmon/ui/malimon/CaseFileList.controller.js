/* globals oTextBundle, Promise */
$.sap.require("sap.secmon.ui.commons.GlobalMessageUtil");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.ui.model.odata.CountMode");
$.sap.require("sap.secmon.ui.commons.Privileges");
$.sap.require("sap.secmon.ui.browse.utils");

sap.ui.define([ 'jquery.sap.global', 'sap/secmon/ui/m/commons/EtdController', 'sap/ui/model/Filter', 'sap/ui/model/Sorter', 'sap/ui/model/json/JSONModel' ], function(jQuery, Controller, JSONModel) {
    "use strict";

    var CaseFileListController =
            Controller.extend("sap.secmon.ui.malimon.CaseFileList", {
                _oSettingDialog : undefined,
                onInit : function() {
                    sap.secmon.ui.browse.utils.createApplicationContextModelSync();
                    this._getCaseFileList();
                    var oUIModel = new sap.ui.model.json.JSONModel();
                    this.getView().setModel(oUIModel, "UIModel");
                    this._initCaseFileModel();
                    this._setRefreshMode("onCaseFiles");
                },
                _getCaseFileList : function(bSelectNew) {
                    var that = this;
                    // set up models
                    var oCaseFileListReadModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/malimon/FSpace.xsodata", {
                        json : true,
                        defaultCountMode : sap.ui.model.odata.CountMode.Inline
                    });
                    oCaseFileListReadModel.read("/FSpaceHeader", {
                        urlParameters: ["$orderby=CreatedAt desc"],
                        success : function(oData, oResponse) {
                            var data = {
                                all : oData.results,
                                selectedItems : []
                            };
                            // default model for data binding
                            var oModel = new sap.ui.model.json.JSONModel();
                            oModel.setData(data);
                            that.getView().setModel(oModel, "CaseFileList");
                            if (bSelectNew) {
                                that._selectNewCreatedCaseFilePage();
                            }
                        },
                        error : function() {
                            sap.ui.commons.MessageBox.show(oTextBundle.getText("MM_MSG_Error"), sap.ui.commons.MessageBox.Icon.ERROR, sap.ui.commons.MessageBox.Action.OK);
                        }
                    });
                },
                _selectNewCreatedCaseFilePage: function () {
                    var oTable = this.getView().byId("caseFileTable");
                    var oTableItems = oTable.getItems();
                    oTable.setSelectedItem(oTableItems[0], true);
                    this.onSelectionChange();
                },
                onNavBack : function(oEvent) {
                    this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
                        window.history.go(-1);
                    });
                },
                onHelpPress : function(oEvent) {
                    window.open("/sap/secmon/help/1ce16151fdf74bdb83f6e070a4a16089.html");
                },
                enabledFormatterOpen: function (aVal) {
                    return aVal.length === 1;
                },
                enabledFormatter : function(aVal) {
                    return aVal.length > 0;
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
                onPressOpenCaseFile : function(oEvent) {
                    var oBindingContext = oEvent.getParameter("listItem").getBindingContext("CaseFileList");
                    var sCaseFileId = new sap.secmon.ui.commons.CommonFunctions().base64ToHex(oBindingContext.getProperty("Id"));
                    var bCaseFileRead = sap.secmon.ui.commons.Privileges.isAuthorized.call(this, "casefileRead"); 
                    if(bCaseFileRead){
                        sap.ui.core.UIComponent.getRouterFor(this).navTo("caseFileDetails", {
                            "caseFileId" : sCaseFileId
                        });
                    }
                },
                onSearch : function(oEvent) {
                    // add filter for search
                    var sQuery = oEvent.getSource().getValue();
                    var table = this.getView().byId("caseFileTable");
                    var binding = table.getBinding("items");
                    if (!sQuery) {
                        binding.filter([]);
                    } else {
                        binding.filter([ new sap.ui.model.Filter([ new sap.ui.model.Filter("Name", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("Namespace", sap.ui.model.FilterOperator.Contains, sQuery), new sap.ui.model.Filter("CreatedBy", sap.ui.model.FilterOperator.Contains, sQuery),
                                new sap.ui.model.Filter("ChangedBy", sap.ui.model.FilterOperator.Contains, sQuery) ], false) ]);
                    }
                },
                onSelectionChange : function(oEvent) {
                    var aSelectedItems = this.getView().byId("caseFileTable").getSelectedItems()
                        .map(function (oItem) { return oItem.getBindingContext("CaseFileList").getObject(); });
                    this.getView().getModel("CaseFileList").setProperty("/selectedItems", aSelectedItems);
                },

                onDeletePress : function(oEvent) {
                    var that = this;
                    var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
                    sap.m.MessageBox.confirm(oTextBundle.getText("MM_MSG_CFDelete"), {
                        title : "{i18n>MM_TIT_CFDelete}",
                        styleClass : bCompact ? "sapUiSizeCompact" : "",
                        actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
                        onClose : function(oAction) {
                            if (oAction === sap.m.MessageBox.Action.YES) {
                                that.fnDeleteCaseFile();
                            }
                        }
                    });
                },

                // multiple delete works
                fnDeleteCaseFile : function() {
                    var that = this;
                    var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
                    var idArray = this.getView().getModel("CaseFileList").getProperty("/selectedItems");
                    var promises = [];
                    for (var i = 0; i < idArray.length; i++) {
                        var oCaseFileModelData = {};
                        oCaseFileModelData.caseFileId = sap.secmon.ui.browse.utils.CommonFunctions.base64ToHex(idArray[i].Id);
                        oCaseFileModelData.operation = "delete";
                        promises.push(sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileModelData)));
                    }

                    Promise.all(promises).then(function(result) {
                        that._getCaseFileList();
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, oTextBundle.getText("MM_MSG_CFDeletedOK"));
                    }).fail(function(error) {
                        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, error.responseText);
                    });
                },

                onCreateCaseFile: function () {
                    if (!this._oCaseFilesCreateDialog) {                        
                        this.createAndFillNamespacesModel();
                        this._oCaseFilesCreateDialog = sap.ui.xmlfragment("CaseFileCreate", "sap.secmon.ui.malimon.CaseFileCreate", this);
                        this.getView().addDependent(this._oCaseFilesCreateDialog);
                        $.sap.syncStyleClass("sapUiSizeCompact", sap.secmon.ui.browse.utils.getView(), this._oCaseFilesCreateDialog);
                    }
                    this._oCaseFilesCreateDialog.open();
                },
    
                createCaseFile: function () {
                    var that = this;
                    var C_CF_DML_PATH = "/sap/secmon/services/malimon/malimonDML.xsjs";
                    var oCaseFileData = this.getView().getModel("caseFileModel").getData();
                    this.getView().getModel("caseFileModel").setProperty("/operation", "insert");
                    var oPromise = sap.secmon.ui.browse.utils.postJSon(C_CF_DML_PATH, JSON.stringify(oCaseFileData));
                    oPromise.done(function (res) {
                        that._getCaseFileList(true);
                        that._oCaseFilesCreateDialog.close();
                    });
                },
    
                onCancelCreateDialog: function () {
                    this._oCaseFilesCreateDialog.close();
                },
    
                _initCaseFileModel: function () {
                    var oCaseFileModel = new sap.ui.model.json.JSONModel({
                        caseFileId: "",
                        name: "",
                        namespace: "",
                        createdBy: "",
                        createdAt: "",
                        changedBy: "",
                        changedAt: "",
                        comments: [],
                        details: [],
                        details2del: [],
                        selectedItems: []
                    });
                    this.getView().setModel(oCaseFileModel, "caseFileModel");
                },
    
                _setRefreshMode: function (oMode) {
                    this.mode = oMode;
                    var oUIModelData = this.getView().getModel("UIModel").getData();
                    switch (this.mode) {
                        case 'none':
                        case 'onSherlog':
                            oUIModelData.backButtonVisible = false;
                            oUIModelData.deleteButtonVisible = false;
                            oUIModelData.addButtonVisible = true;
                            oUIModelData.columnItemsType = "Inactive";
                            break;
                        case 'onCaseFiles':
                            oUIModelData.backButtonVisible = true;
                            oUIModelData.deleteButtonVisible = true;
                            oUIModelData.addButtonVisible = false;
                            oUIModelData.columnItemsType = "Navigation";
                            break;
                        case 'onLogEvents':
                            oUIModelData.backButtonVisible = false;
                            oUIModelData.deleteButtonVisible = false;
                            oUIModelData.addButtonVisible = true;
                            oUIModelData.columnItemsType = "Inactive";
                            break;   
                    }
                    this.getView().getModel("UIModel").setData(oUIModelData);
                }
                
            });
    return CaseFileListController;

});