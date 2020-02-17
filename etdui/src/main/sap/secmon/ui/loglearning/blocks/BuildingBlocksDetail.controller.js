/* globals oTextBundle */
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.loglearning.Helper");
jQuery.sap.require("sap.ui.model.odata.CountMode");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.loglearning.blocks.BuildingBlocksDetail", {

    oRouter : null,
    fnAutoRefresh : undefined,
    _sGroupHash : undefined,
    _oCommonFunctions : null,

    handleRouteMatched : function(oEvent) {
        if (oEvent.getParameters().name !== "BuildingBlockDetails") {
            return;
        }
        this._sGroupHash = oEvent.getParameters().arguments.GroupHash;
        this._refresh();
    },

    _refresh : function() {
        this.getView().getModel().loadData("/sap/secmon/loginterpretation/logDiscoveryAPI.xsodata/ConstantValueGroup(X'" + this._sGroupHash + "')?$format=json&$expand=Attributes,RunUsage");
    },

    onInit : function() {
        this._oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

        this.oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        this.oRouter.attachRoutePatternMatched(this.handleRouteMatched, this);

        this.getView().setModel(new sap.ui.model.json.JSONModel());

        this.getView().setModel(new sap.ui.model.json.JSONModel({
            isSelected : false,
            isSaveNeeded : false
        }), "UI");

        // Semantic attributes from kb
        var oKBAttributesModel = new sap.ui.model.json.JSONModel();
        var that = this;
        $.ajax({
            url : "/sap/secmon/services/KnowledgeBase.xsodata/AttributeForLogLearning?$format=json",
            async : true,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                that.buildAttributesModel(data.d.results);
            },
            error : function(xhr, textStatus, errorThrown) {
                alert(that._oCommonFunctions.constructAjaxErrorMsg(xhr, textStatus, errorThrown));
            }
        });
        this.getView().setModel(oKBAttributesModel, "KBAttributes");

        this.getView().getModel().attachRequestCompleted(this._setCount, this);
    },

    buildAttributesModel : function(aData) {
        var oKBTextModel = this.getView().getModel("i18nknowledge");
        var aResult = aData.map(function(oEntry) {
            return {
                name : oEntry.name,
                nameSpace : oEntry.nameSpace,
                hash : oEntry.hash,
                displayNameKey : oEntry.displayNameKey,
                displayName : oKBTextModel.getProperty(oEntry.displayNameKey),
                description : oKBTextModel.getProperty(oEntry.descriptionKey),
            };
        });
        this.getView().getModel("KBAttributes").setData({
            AttributeForLogLearning : aResult
        });
    },

    reportWarning : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Warning, sText, sText);
    },

    reportErrorMessage : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Error, sText);
    },

    reportSuccess : function(sText) {
        new sap.secmon.ui.commons.GlobalMessageUtil().addMessage(sap.ui.core.MessageType.Success, sText);
    },

    onNavBack : function() {
        this.getComponent().getNavigationVetoCollector().noVetoExists().done(function() {
            window.history.go(-1);
        });
    },

    _setCount : function() {
        var oList = this.getView().byId("table");
        var count = oList.getBinding("items").getLength();
        this.getView().byId("page").setTitle(this.getView().getModel("i18n").getProperty("Interpret_ConstVal") + " (" + count + ")");
    },

    onPressSettings : function(oEvent) {
        var oDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.blocks.SettingsDialog", this);
        this.getView().addDependent(oDialog);
        oDialog.open();
    },

    onPressValueHelpSettings : function(oEvent) {
        this._oValueHelpSettingsDialog = sap.ui.xmlfragment("sap.secmon.ui.loglearning.blocks.SemanticAttributesSettingsDialog", this);
        this.getView().addDependent(this._oValueHelpSettingsDialog);
        this._oValueHelpSettingsDialog.open();
    },

    onConfirm : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [];
        var sPath, bDescending;
        // apply sorter
        if (mParams.groupItem) {
            sPath = mParams.groupItem.getKey();
            bDescending = mParams.groupDescending;
            aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, true));
        }
        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
    },

    onConfirmValueHelp : function(oEvent) {
        var oTable = sap.ui.core.Fragment.byId("SemanticAttributeValueHelp", "table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");
        var aSorters = [];
        var sPath, bDescending;
        // apply sorter
        if (mParams.groupItem) {
            sPath = mParams.groupItem.getKey();
            bDescending = mParams.groupDescending;
            aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, true));
        }
        sPath = mParams.sortItem.getKey();
        bDescending = mParams.sortDescending;
        aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
        oBinding.sort(aSorters);
    },

    onClear : function(oEvent) {
        var oFilterBar = this.getView().byId("filterBar");
        var oItems = oFilterBar.getAllFilterItems(true);
        for (var i = 0; i < oItems.length; i++) {
            var oControl = oFilterBar.determineControlByFilterItem(oItems[i]);
            if (oControl) {
                oControl.setValue("");
            }
        }
    },

    onSearch : function(oEvent) {
        var oView = this.getView();
        var oTable = oView.byId("table");
        var mParams = oEvent.getParameters();
        var oBinding = oTable.getBinding("items");

        // apply filters to binding
        var aFilters = [];

        $.each(mParams.selectionSet, function(index, element) {
            var sPath;

            switch (index) {
            case 0:
                sPath = "Id";
                break;
            case 1:
                sPath = "Name";
                break;
            case 2:
                sPath = "Namespace";
                break;
            case 3:
                sPath = "Description";
                break;
            case 4:
                sPath = "Status";
                break;
            }

            if (element.getValue() !== "") {
                var oFilter = new sap.ui.model.Filter(sPath, sap.ui.model.FilterOperator.Contains, element.getValue(), null);
                aFilters.push(oFilter);
            }
        });

        oBinding.filter(aFilters);
    },

    onSelectionChange : function(oEvent) {
        this.getView().getModel("UI").setProperty("/isSelected", this.getView().byId("table").getSelectedItems().length > 0 ? true : false);
    },

    onItemPress : function(oEvent) {
        var sRunName = oEvent.getParameter("listItem").getBindingContext().getProperty("RunName.RunName");
        sap.secmon.ui.m.commons.NavigationService.openLogLearningRun(sRunName);
    },

    onPressAdd : function(oEvent) {
        var oData = this.getView().getModel().getData();
        oData.d.Attributes.results.push({
            AttrHash : '',
            Value : ''
        });
        this.getView().getModel().setData(oData);
        this.getView().getModel("UI").setProperty("/isSaveNeeded", true);
    },

    onPressRemove : function(oEvent) {
        var aSelectedItems = this.getView().byId("table").getSelectedItems();
        var oData = this.getView().getModel().getData();
        var aIndexes = [];

        // Collect indexes to be deleted
        $.each(aSelectedItems, function(indexItem, item) {
            $.each(oData.d.Attributes.results, function(index, element) {
                if (item.getBindingContext().getProperty("AttrHash") === element.AttrHash) {
                    aIndexes.push(index);
                }
            });
        });

        // sort indices descending
        aIndexes.sort(function(a, b) {
            return b - a;
        });

        // Remove them from the model
        $.each(aIndexes, function(index, item) {
            oData.d.Attributes.results.splice(item, 1);
        });

        this.getView().getModel().setData(oData);
        this.getView().getModel("UI").setProperty("/isSaveNeeded", true);

        this.getView().byId("table").removeSelections(true);
    },

    onChangeValue : function(oEvent) {
        this.getView().getModel("UI").setProperty("/isSaveNeeded", true);
    },

    onPressSave : function(oEvent) {
        var that = this;
        var oView = this.getView();
        var oData = this.getView().getModel().getData().d;
        var oDataPost = {
            GroupName : oData.GroupName,
            GroupNameSpace : oData.GroupNameSpace,
            Attributes : []
        };

        $.each(oData.Attributes.results, function(index, element) {
            if (element.AttrHash) {
                oDataPost.Attributes.push({
                    AttrHash : that._oCommonFunctions.base64ToHex(element.AttrHash),
                    Value : element.Value
                });
            }
        });

        if (oDataPost.Attributes.length <= 0) {
            this.reportErrorMessage(oTextBundle.getText("Interpret_EmptyBBError"));
            return;
        }

        oView.setBusy(true);
        var promise = new sap.secmon.ui.commons.AjaxUtil().postJson("/sap/secmon/loginterpretation/runService.xsjs?command=updateConstantValueBuildingBlock", JSON.stringify(oDataPost));
        promise.fail(function(jqXHR, textStatus, errorThrown) {
            that._refresh();
            oView.setBusy(false);
            that.reportErrorMessage(decodeURIComponent(jqXHR.responseText));
        });
        promise.done(function(data, textStatus, jqXHR) {
            that._refresh();
            oView.setBusy(false);
            that.reportSuccess(oTextBundle.getText("Interpret_BBSaved"));
            oView.getModel("UI").setProperty("/isSaveNeeded", false);
        });
    },

    onValueHelpAttribute : function(oEvent) {
        this._oValueHelpDialog = null;
        this._oBindingContext = oEvent.getSource().getBindingContext();
        this._getValueHelpDialog().open();
    },

    _getValueHelpDialog : function() {
        if (!this._oValueHelpDialog) {
            this._oValueHelpDialog = sap.ui.xmlfragment("SemanticAttributeValueHelp", "sap.secmon.ui.loglearning.blocks.SemanticAttributeValueHelpDialog", this);
            this.getView().addDependent(this._oValueHelpDialog);
        }
        return this._oValueHelpDialog;
    },

    onCloseValueHelpDialog : function(oEvent) {
        var that = this;

        if (oEvent.getParameters().id.endsWith("ok")) {
            var aSelectedItems = sap.ui.core.Fragment.byId("SemanticAttributeValueHelp", "table").getSelectedItems();
            if (aSelectedItems.length === 1) {
                var oModel = this._oBindingContext.getModel();
                var oObject = aSelectedItems[0].getBindingContext("KBAttributes").getObject();

                oModel.setProperty("AttrName", oObject.name, that._oBindingContext);
                oModel.setProperty("AttrNameSpace", oObject.nameSpace, that._oBindingContext);
                oModel.setProperty("AttrDisplayName", oObject.displayName, that._oBindingContext);
                oModel.setProperty("AttrDisplayNameKey", oObject.displayNameKey, that._oBindingContext);
                oModel.setProperty("AttrHash", oObject.hash, that._oBindingContext);

                that.getView().getModel("UI").setProperty("/isSaveNeeded", true);
            } else {
                that.reportErrorMessage(oTextBundle.getText("Interpret_SelectAnAttr"));
                return;
            }
        }
        this._getValueHelpDialog().destroy();
    }
});