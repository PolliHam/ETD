jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.settings.util.Formatter");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.m.MessageToast");
jQuery.sap.require("sap.secmon.ui.commons.AjaxUtil");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.includeStyleSheet("/sap/secmon/ui/m/css/common.css");

sap.secmon.ui.m.commons.EtdController.extend("sap.secmon.ui.m.settings.view.EnumExtensions", {

    EXPORT_SERVICE : "/sap/secmon/services/replication/export.xsjs",
    ajaxUtil : null,

    oModelData : [],
    aCrumbs : [],
    oModel : null,
    uiModel : null,

    leafReached : false,
    topReached : true,
    currentDepth : 0,
    currentPath : "",

    enumService : null,
    oCommons : null,

    constructor : function() {
        sap.ui.core.mvc.Controller.apply(this, arguments);
    },

    onInit : function() {
        this.enumService = new sap.secmon.ui.commons.EnumService();
        this.ajaxUtil = new sap.secmon.ui.commons.AjaxUtil();
        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();

        // create tree model
        this.oModelData = {
            enumValues : [ { // Investigation
                Name : this.getText("EntityInvestigation_XLBL"),
                Key : "sap.secmon.services.ui.m.invest/Investigation",
                deleted : false,
                editable : "true",
                isNew : false,
                enumValues : [ {
                    Name : this.getText("AttributeAttack_XLBL"),
                    Key : "sap.secmon.services.ui.m.invest/Investigation/Attack",
                    deleted : false,
                    editable : "true",
                    isNew : false,
                    enumValues : []
                }, {
                    Name : this.getText("AttributeManVis_XLBL"),
                    Key : "sap.secmon.services.ui.m.invest/Investigation/ManagementVisibility",
                    deleted : false,
                    editable : "true",
                    isNew : false,
                    enumValues : []
                } ]
            }, { // Workspace
                Name : this.getText("EntityWorkspace_XLBL"),
                Key : "sap.secmon.ui.browse/Workspace",
                deleted : false,
                editable : "true",
                isNew : false,
                enumValues : [ {
                    Name : this.getText("AttributeRiskClass_XLBL"),
                    Key : "sap.secmon.ui.browse/Workspace/RiskClassification",
                    deleted : false,
                    editable : "true",
                    isNew : false,
                    enumValues : []
                }, {
                    Name : this.getText("AttributeProcStatus_XLBL"),
                    Key : "sap.secmon.ui.browse/Workspace/ProcessStatus",
                    deleted : false,
                    editable : "true",
                    isNew : false,
                    enumValues : []
                } ]
            } ]
        };
        this.oModel = new sap.ui.model.json.JSONModel(this.oModelData);
        this.getView().setModel(this.oModel);

        // load enum data from backend and insert them into model
        this.loadData();

        // ui Model holds flags on which buttons are bound
        this.uiModel = new sap.ui.model.json.JSONModel({
            // flag if tree hierarchy reached bottom
            leafReached : this.leafReached,
            // flag if tree hierarchy is at its top
            topReached : this.topReached,
            // user changed data
            changed : false,
            // user checked a checkbox
            checked : false

        });
        this.getView().setModel(this.uiModel, "uiModel");

        this.getComponent().getNavigationVetoCollector().register(function() {

            if (this.uiModel.getProperty("/changed") === false) {
                return true;
            } else {
                var oDeferred = $.Deferred();
                this.handleCancel(function() {
                    oDeferred.resolve();
                }, function() {
                    oDeferred.reject();
                });
                return oDeferred.promise();
            }
        }, this);

        this.aCrumbs = [ this.getText("Entities_XLBL"), this.getText("ProcessFields_XLBL"), this.getText("Values_XLBL") ];
        // side-effect: The flag "leafReached" is calculated and set in uiModel
        this.buildBreadcrumb("/");
    },

    /**
     * user clicks on a table line. We drill down into hierarchy.
     */
    onSelectListItem : function(oEvent) {
        var context = oEvent.getSource().getBindingContext();
        var data = context.getObject();
        if (data.enumValues) {
            var path = context.getPath();
            var newPath = path + "/enumValues";

            this.bindTable(newPath);
            this.buildBreadcrumb(path);
        }
    },

    /**
     * user checks checkbox at beginning of a table line.
     */
    onCheck : function(oEvent) {
        var aCheckedItems = this.getCheckedContexts();
        var uiData = this.uiModel.getData();
        uiData.checked = aCheckedItems.length > 0;
        this.uiModel.setData(uiData);
    },

    onBackButtonPressed : function() {
        window.history.go(-1);
    },

    /**
     * populate the breadcrumb container. As a side-effect, set properties "leafReached" (drill-down passible?), "currentDepth", and "currentPath"
     */
    buildBreadcrumb : function(sPath) {
        var that = this;
        var container = this.getBreadcrumbContainer();
        container.destroyItems();
        var aParts = sPath.split("/");
        var absolutePath = "";
        var oPart;
        var depth = 0;

        container.addItem(new sap.m.Link({
            text : that.aCrumbs[0],
            target : "/",
            press : [ that.handleBreadcrumbPress, that ]
        }));
        container.addItem(new sap.m.Label({
            textAlign : "Center",
            text : ' > '
        }).addStyleClass("crumbArrow"));

        aParts = aParts.filter(function(sPart) {
            return sPart && sPart.length > 0;
        });
        for (var index = 0; index < aParts.length; index++) {
            var sPart = aParts[index];
            absolutePath += "/" + sPart;
            if (!oPart) {
                oPart = that.oModelData[sPart];
            } else {
                oPart = oPart[sPart];
            }
            if (oPart.Name) {
                depth++;
                var link = new sap.m.Link({
                    text : oPart.Name,
                    target : absolutePath,
                    press : [ that.handleBreadcrumbPress, that ]
                });
                container.addItem(link);
                container.addItem(new sap.m.Label({
                    textAlign : "Center",
                    text : ' > '
                }).addStyleClass("crumbArrow"));
            }
        }

        this.leafReached = depth === this.aCrumbs.length - 1;
        this.currentDepth = depth;
        this.currentPath = sPath;

        if (depth > 0) {
            container.addItem(new sap.m.Text({
                text : that.aCrumbs[depth]
            }));

            if (!this.leafReached) {
                container.addItem(new sap.m.Label({
                    textAlign : "Center",
                    text : ' > '
                }).addStyleClass("crumbArrow"));
            }
        }

        var uiData = this.uiModel.getData();
        uiData.leafReached = this.leafReached;
        uiData.topReached = depth === 0;
        this.uiModel.setData(uiData);
        // set flag "checked"
        this.onCheck();
    },

    handleBreadcrumbPress : function(oEvent) {
        var target = oEvent.getSource().getTarget();
        var bEndsWithValues = jQuery.sap.endsWith(target, "enumValues");
        var bEndsWithSlash = jQuery.sap.endsWith(target, "/");
        var pathWithTrailingEnums = bEndsWithValues ? target : target + (bEndsWithSlash ? "" : "/") + "enumValues";
        var pathWithoutTrailingEnums = bEndsWithValues ? target.substring(0, target.length - "/enumValues".length) : target;
        this.bindTable(pathWithTrailingEnums);
        this.buildBreadcrumb(pathWithoutTrailingEnums);
    },

    /**
     * user changed value of input field "Value"
     */
    onValueChange : function(oEvent) {
        // flag the data as dirty
        var context = oEvent.getSource().getBindingContext();
        var data = context.getObject();
        data.changed = true;

        var uiData = this.uiModel.getData();
        uiData.changed = true;
        this.uiModel.setData(uiData);
    },

    /**
     * Delete: If the enum value has been previously added but not persisted yet: Remove it from the JSON model. Otherwise, flag it as logically deleted (It will be deleted on save).
     */
    onDeleteValue : function(oEvent) {
        var aContexts = this.getCheckedContexts();
        if (aContexts.length > 0) {
            var length = aContexts.length;
            // count downwards when removing entries
            for (var index = length - 1; index >= 0; index--) {
                var oContext = aContexts[index];
                if (oContext.getProperty("isNew")) {
                    var sPath = oContext.getPath();
                    // the sPath looks like: "/enumValues/0/enumValues/1/enumValues/3"
                    var iLastSlash = sPath.lastIndexOf("/");
                    var sEnumsListPath = sPath.substring(0, iLastSlash);
                    var iEnumIndex = parseInt(sPath.substring(iLastSlash + 1));

                    var aEnumsList = this.oModel.getObject(sEnumsListPath);
                    aEnumsList.splice(iEnumIndex, 1);
                } else {
                    var data = oContext.getObject();
                    data.deleted = true;
                }
            }
            this.oModel.setData(this.oModelData);
            this.oModel.refresh(true);

            var uiData = this.uiModel.getData();
            uiData.changed = true;
            uiData.checked = false;
            this.uiModel.setData(uiData);
        }

    },

    /**
     * add a new entry to the JSON model
     */
    onAddValue : function(oEvent) {
        // currentPath looks like "/enumValues/0/enumValues/2"
        var enumsList = this.oModel.getObject(this.currentPath + "/enumValues");
        enumsList.push(this.createNewEntry());
        this.oModel.setData(this.oModelData);
        this.oModel.refresh();

        var uiData = this.uiModel.getData();
        uiData.changed = true;
        this.uiModel.setData(uiData);
    },

    /**
     * persist the new, changed, or deleted values in the JSON model to the backend
     */
    onSave : function(oEvent) {
        var that = this;
        var oConvertedData = this.convertODataModel();
        this.enumService.saveEnums(oConvertedData, function() {
            sap.m.MessageToast.show(that.getText("ChangeSaved_MSG"));
            that.loadData();

        }, function(error) {
            alert("Error: " + error);
        });
    },

    /**
     * discard all changes in the JSON model by loading data from backend
     */
    onCancel : function(oEvent) {
        this.handleCancel();
    },

    onExportSelectedPressed : function(oEvent) {
        var that = this;
        var aExportObjects = [];

        // Do not use this.getEnumsTable().getSelectedContexts();
        var aSelectedContexts = this.getCheckedContexts();
        aSelectedContexts.forEach(function(oContext) {
            // path might look like "enumValues/0" or "enumValues/0/enumValues/1" depending on hierarchy depth
            var path = oContext.getPath();
            var oObject = that.oModel.getObject(path);
            // key looks like "sap.secmon.services.ui.m.invest/Investigation" or "sap.secmon.services.ui.m.invest/Investigation/Attack",
            // depending on hierarchy depth
            var aKeyParts = oObject.Key.split("/");
            if (aKeyParts.length === 2) { // the object is an entity, e.g. "sap.secmon.services.ui.m.invest/Investigation"
                // drill down to attributes
                oObject.enumValues.forEach(function(oAttribute) {
                    var aAttributeKeyParts = oAttribute.Key.split("/");
                    aExportObjects.push({
                        Id : that.oCommons.base64ToHex(jQuery.sap.uid()),
                        ObjectType : "ProcessFields",
                        ObjectName : aAttributeKeyParts[1] + "/" + aAttributeKeyParts[2],
                        ObjectNamespace : aAttributeKeyParts[0]
                    });
                });
            } else if (aKeyParts.length === 3) { // the object is an attribute, e.g. "sap.secmon.services.ui.m.invest/Investigation/Attack"
                aExportObjects.push({
                    Id : that.oCommons.base64ToHex(jQuery.sap.uid()),
                    ObjectType : "ProcessFields",
                    ObjectName : aKeyParts[1] + "/" + aKeyParts[2],
                    ObjectNamespace : aKeyParts[0]
                });
            }

        });

        this.ajaxUtil.postJson(this.EXPORT_SERVICE, JSON.stringify(aExportObjects), {
            success : function(aParams) {
                sap.m.MessageToast.show(that.getText("ProcFieldsExported_MSG"));
            },
            fail : function(status, sErrorText) {
                sap.m.MessageBox.alert(sErrorText);
            }
        });
    },

    getEnumsTable : function() {
        return this.getView().byId("enumExtensionsTable");
    },

    getListItemTemplate : function() {
        return this.getView().byId("listItemTemplate");
    },

    getBreadcrumbContainer : function() {
        return this.getView().byId("breadcrumbContainer");
    },

    /**
     * get the contexts of table items where the checkbox is checked.
     */
    getCheckedContexts : function() {
        var table = this.getEnumsTable();
        var items = table.getItems();
        var contexts = items.map(function(oItem) {
            return oItem.getBindingContext();
        });
        return contexts.filter(function(oContext) {
            return oContext.getProperty("checked") === true;
        });
    },

    getFilter : function() {
        return new sap.ui.model.Filter({
            path : "deleted",
            operator : "NE",
            value1 : true,
        });
    },

    bindTable : function(path) {
        var table = this.getEnumsTable();
        table.bindItems({
            path : path,
            template : this.getListItemTemplate(),
            filters : [ this.getFilter() ]
        });
    },

    /**
     * load enum data from backend and insert it into oModel
     */
    loadData : function() {
        var that = this;
        // comma-separated package paths
        var sRoots = this.oModelData.enumValues.map(function(oEntity) {
            return oEntity.Key.split("/")[0];
        }).join(",");
        var enumsPromise = this.enumService.loadEnumsAsync(sRoots);
        enumsPromise.done(function(enumData) {
            that.oModelData.enumValues.forEach(function(oEntity) {
                oEntity.enumValues.forEach(function(oField) {
                    // oField.Key looks something like "sap.secmon.services.ui.m.invest"/Investigation/Attack"
                    var aPathParts = oField.Key.split("/");
                    oField.enumValues = enumData[aPathParts[0]][aPathParts[1]][aPathParts[2]].enumValues;
                    // initialize with meta data
                    oField.enumValues.forEach(function(oVal) {
                        oVal.checked = false;
                        oVal.changed = false;
                        oVal.isNew = false;
                        oVal.deleted = false;
                    });
                });
            });
            that.oModel.setData(that.oModelData);
            that.oModel.refresh();
            var uiData = that.uiModel.getData();
            uiData.changed = false;
            that.uiModel.setData(uiData);
            that.uiModel.refresh();
        });
    },

    /**
     * return a new entry with default values
     */
    createNewEntry : function() {
        return {
            Key : jQuery.sap.uid(),
            Value : this.getText("enterValue_MSG"),
            SortOrder : 999,
            TextKey : null,
            // some meta data
            changed : true,
            editable : "true",
            isNew : true,
            deleted : false
        };
    },

    handleCancel : function(fnActionAfterCancel, fnActionOnNoCancellation) {
        var that = this;
        if (this.uiModel.getProperty("changed") === false) {
            if (fnActionAfterCancel) {
                fnActionAfterCancel();
            }
            return;
        }
        var title = this.getCommonText("Confirmation_TIT");
        sap.m.MessageBox.show(this.getCommonText("Confirm_Cancel_MSG"), {
            title : title,
            icon : sap.m.MessageBox.Icon.QUESTION,
            actions : [ sap.m.MessageBox.Action.YES, sap.m.MessageBox.Action.NO ],
            onClose : function(oAction) {
                if (oAction === sap.m.MessageBox.Action.YES) {
                    that.loadData();
                    if (fnActionAfterCancel) {
                        fnActionAfterCancel();
                    }
                } else {
                    if (fnActionOnNoCancellation) {
                        fnActionOnNoCancellation();
                    }
                }
            }
        });
    },

    /**
     * convert the OData model in the internal format into a format understood by EnumService
     */
    convertODataModel : function() {
        var newData = {};
        this.oModelData.enumValues.forEach(function(oObject) {
            // the key looks like "sap.secmon.ui.m.invest/Investigation"
            var aObjectParts = oObject.Key.split("/");
            var sPackage = aObjectParts[0];
            var sObject = aObjectParts[1];
            var oNewPackage = {};
            newData[sPackage] = oNewPackage;
            var oNewObject = {};
            oNewPackage[sObject] = oNewObject;
            oObject.enumValues.forEach(function(oAttribute) {
                // the key looks like "sap.secmon.ui.m.invest/Investigation/Attack"
                var aAttributeParts = oAttribute.Key.split("/");
                var sAttribute = aAttributeParts[2];
                oNewObject[sAttribute] = {
                    enumValues : oAttribute.enumValues
                };
            });
        });
        return newData;
    },

    onPressHelp : function(oEvent) {
        window.open("/sap/secmon/help/f797ced9d16d430b88798253968201e3.html");
    },

});
