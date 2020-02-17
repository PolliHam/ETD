// This is necessary to find sap secmon objects. Without it, they will be sought under sap.ui packages

// The next two lines call up the libraries for preloading - this is necessary
// - /sap/secmon/ui/commons/library.js
// - /sap/secmon/ui/m/commons/library.js
// For this reason, we see in the browser console several cancelled requests to the backend, for example
// - /sap/ui5/1/resources/sap/secmon/ui/commons/themes/sap_bluecrystal/library.css
// Ignore these errors, because they are caused by these two lines, and there should not be files in the wrong path
// All the necessary libs/styles are already loaded with the standard mechanism
sap.ui.getCore().loadLibrary("sap.secmon.ui.commons");
sap.ui.getCore().loadLibrary("sap.secmon.ui.m.commons");

jQuery.sap.registerResourcePath("/sap/secmon", "../../../../../../../sap/secmon");
jQuery.sap.registerModulePath("sap.secmon", "../../../../../../../sap/secmon");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");
jQuery.sap.require("sap.secmon.ui.m.commons.LaunchpadRefresher");
jQuery.sap.declare("sap.secmon.ui.m.commons.EtdComponent");
jQuery.sap.require("sap.ui.core.UIComponent");
jQuery.sap.require("sap.m.MessageBox");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.core.UIComponent.extend("sap.secmon.ui.m.commons.EtdComponent", {

    init : function() {
        sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

        this.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        var mConfig = this.getMetadata().getConfig();

        // set i18n model
        var i18nModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : mConfig.resourceBundle
        });
        this.setModel(i18nModel, "i18n");

        // set i18n common model
        var i18nCommonModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle"
        });
        this.setModel(i18nCommonModel, "i18nCommon");

        // set device model
        var deviceModel = new sap.ui.model.json.JSONModel({
            isTouch : sap.ui.Device.support.touch,
            isNoTouch : !sap.ui.Device.support.touch,
            isPhone : sap.ui.Device.system.phone,
            isNoPhone : !sap.ui.Device.system.phone,
            isTablet : sap.ui.Device.system.tablet,
            isLandscape : sap.ui.Device.orientation.landscape,
            isDesktop : sap.ui.Device.system.desktop !== undefined && sap.ui.Device.system.desktop,
            isPortrait : sap.ui.Device.orientation.portrait,
            isLargeDesktopWidth : false, // width is over 1440 pixels,
            // depends on orientation
            listMode : sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
            listItemType : sap.ui.Device.system.phone ? "Active" : "Inactive"
        });
        sap.ui.Device.orientation.attachHandler(function(oParams) {
            var data = deviceModel.getData();
            data.isLandscape = oParams.landscape;
            data.isPortrait = !oParams.landscape;
            deviceModel.setData(data);
        });

        function widthChanged(mParams) {
            var data = deviceModel.getData();
            data.isLargeDesktopWidth = (mParams.name === 'LargeDesktop');
            deviceModel.setData(data);
        }

        // initialize isLargeDesktopWidth
        if (sap.ui.Device.media.RANGESETS.SAP_STANDARD_EXTENDED === undefined) {
            // The range "LargeDesktop" is added in version 1.32 only
            sap.ui.Device.media.RANGESETS.SAP_STANDARD_EXTENDED = "Std_Ext";
            sap.ui.Device.media.initRangeSet(sap.ui.Device.media.RANGESETS.SAP_STANDARD_EXTENDED, [ 600, 1024, 1440 ], "px", [ "Phone", "Tablet", "Desktop", "LargeDesktop" ]);
        }

        var currentRange = sap.ui.Device.media.getCurrentRange(sap.ui.Device.media.RANGESETS.SAP_STANDARD_EXTENDED);
        widthChanged(currentRange);
        sap.ui.Device.media.attachHandler(widthChanged, null, sap.ui.Device.media.RANGESETS.SAP_STANDARD_EXTENDED);

        deviceModel.setDefaultBindingMode("OneWay");
        this.setModel(deviceModel, "device");

        var oConfig = this.getMetadata().getConfig();
        this.loadBackendModels(oConfig.backendConfig);

        sap.secmon.ui.m.commons.LaunchpadRefresher.ensureHookIsInstalled();
    },

    loadBackendModels : function(oBackendConfig) {
        var aPromises = [];
        var that = this;
        if (oBackendConfig !== undefined && oBackendConfig !== null) {
            if (oBackendConfig.loadKnowledgeBaseTexts === true) {
                var knowledgeBasePromise = this.createKnowledgeBaseTextBundle();
                aPromises.push(knowledgeBasePromise);
            }
            if (oBackendConfig.loadCSRFToken === true) {
                var oTokenPromise = this.oCommons.getXCSRFTokenAsync();
                oTokenPromise.done(function(token) {
                    that._sCsrfToken = token;
                });
                aPromises.push(oTokenPromise);
            }
            if (oBackendConfig.loadEnums) {
                var oEnumService = new sap.secmon.ui.commons.EnumService();
                var sPackageRoot = oBackendConfig.loadEnums;
                var oEnumsPromise = oEnumService.loadEnumsAsync(sPackageRoot);
                oEnumsPromise.done(function(oEnums) {
                    that.createEnumsModel(oEnums);
                });
                aPromises.push(oEnumsPromise);
            }
            if (oBackendConfig.loadHanaUsers === true) {
                this.createHanaUsersModelAsync();
                this.setModel(sap.ui.getCore().getModel("hanaUsers"), "hanaUsers");
            }
            if (oBackendConfig.loadPatternDefinitions === true) {
                var oPatternsPromise = this.createPatternsModelAsync();
                oPatternsPromise.done(function(oPatternsModel) {
                    that.setModel(oPatternsModel, 'Patterns');
                    // controls not using paging (e.g. filter list on view settings)
                    // should show all patterns
                    oPatternsModel.setSizeLimit(5000);
                });
                aPromises.push(oPatternsPromise);
            }
        }

        var oAppCtxPromise = this.createApplicationContextModelAsync();
        oAppCtxPromise.done(function(oApplicationContextModel) {
            that.setModel(oApplicationContextModel, 'applicationContext');
            that.setTitle(oApplicationContextModel.getData().SID);
        });
        aPromises.push(oAppCtxPromise);

        $.when.apply($, aPromises).done(function() {
            that.onComponentReady();
        });
    },

    setTitle : function(sSID) {
        document.title = "[" + sSID + "] " + this.getMetadata().getConfig().title;
    },

    getCsrfToken : function() {
        return this._sCsrfToken;
    },

    createEnumsModel : function(oEnums) {
        var oModel = new sap.ui.model.json.JSONModel();
        // ensure that all relevant enum values are displayed
        oModel.setSizeLimit(500);
        oModel.setData(oEnums);
        this.setModel(oModel, "enums");
    },

    onComponentReady : function() {

    },

    destroyRouter : function() {
        if (this.getRouter() !== undefined) {
            this.getRouter().destroy();
        }
        this._oRouter = undefined;
    },

    setDefaultODataModel : function(sConfigName) {
        var mConfig = this.getMetadata().getConfig();
        var sServiceUrl = mConfig[sConfigName].serviceUrl;
        var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.setModel(oModel);
    },

    setODataModel : function(sConfigName) {
        var mConfig = this.getMetadata().getConfig();
        var sServiceUrl = mConfig[sConfigName].serviceUrl;
        var sModelName = mConfig[sConfigName].name;
        var oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oModel.attachRequestFailed(this.oCommons.handleRequestFailed);
        this.setModel(oModel, sModelName);
    },

    createHanaUsersModelAsync : function() {
        //do not load hana users again
        if (sap.ui.getCore().getModel("hanaUsers")){
            return;
        }else{
            var oModel = new sap.ui.model.json.JSONModel();
            // display up to 5000 items instead of only 100
            oModel.setSizeLimit(5000);
            sap.ui.getCore().setModel(oModel, 'hanaUsers');
        }

        $.ajax({
            url : encodeURI("/sap/secmon/services/ui/m/commons/hanaUsers.xsjs"),
            async : true,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var aUsers = JSON.parse(data);
                aUsers.sort(function (a, b) {
                    a = a.USER_NAME.toLowerCase();
                    b = b.USER_NAME.toLowerCase();
                    return a < b ? -1 : (a > b) ? 1 : 0;
                });
                //first value should be an empty, for an unassigned user.
                if (aUsers[0].USER_NAME === ""){
                    aUsers[0].USER_NAME = this.getModel("i18n").getProperty("InvestFS_Unassigned_User");
                }

                sap.ui.getCore().getModel('hanaUsers').setData(aUsers);
            }.bind(this),
            error : function(xhr, textStatus, errorThrown) {
                sap.m.MessageBox.alert(this.oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown), {
                    title : this.getModel("i18nCommon").getProperty("Error_TIT")
                });
            }.bind(this)
        });
    },

    createPatternsModelAsync : function() {
        var oDeferred = $.Deferred();
        $.ajax({
            url : encodeURI("/sap/secmon/services/ui/m/patterns/WorkspacePatternDefinition.xsodata/WorkspacePatterns?$format=json"),
            async : true,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData({
                    WorkspacePatterns : data.d.results
                });
                oDeferred.resolve(oModel);
            },
            error : function(xhr, textStatus, errorThrown) {
                oDeferred.reject();
                sap.m.MessageBox.alert(this.oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown), {
                    title : this.getModel("i18nCommon").getProperty("Error_TIT")
                });
            }.bind(this)
        });
        return oDeferred.promise();
    },
    createKnowledgeBaseTextBundle : function() {
        var oDeferred = $.Deferred(), promise = oDeferred.promise();
        var that = this, resourceModel;
        var requestCompleteHandler = function() {
            oDeferred.resolve(resourceModel);

            resourceModel.detachRequestCompleted(requestCompleteHandler, this);
        };
        resourceModel = new sap.ui.model.resource.ResourceModel({
            bundleUrl : "/sap/secmon/texts/KnowledgeBase.hdbtextbundle",
            async : true
        }).attachRequestCompleted(null, requestCompleteHandler, this);
        resourceModel.attachRequestFailed(null, function() {
            oDeferred.reject();
        });
        promise.done(function() {
            that.setModel(resourceModel, "i18nknowledge");
        });

        return promise;
    },
    createApplicationContextModelAsync : function() {
        var oDeferred = $.Deferred();
        $.ajax({
            url : encodeURI("/sap/secmon/services/common/ApplicationContext.xsjs"),
            async : true,
            type : "GET",
            success : function(data, textStatus, XMLHttpRequest) {
                var oModel = new sap.ui.model.json.JSONModel();
                oModel.setData(data);
                oDeferred.resolve(oModel);
            },
            error : function(xhr, textStatus, errorThrown) {
                oDeferred.reject();
                sap.m.MessageBox.alert(this.oCommons.constructAjaxErrorMsg(xhr, textStatus, errorThrown), {
                    title : this.getModel("i18nCommon").getProperty("Error_TIT")
                });
            }.bind(this)
        });
        return oDeferred.promise();
    },

    getNavigationVetoCollector : function() {
        if (!this.navigationVetoCollector) {
            this.navigationVetoCollector = new sap.secmon.ui.m.commons.VetoCollector();
        }

        return this.navigationVetoCollector;
    }

});
