/* globals oTextBundle */
$.sap.require("sap.ui.commons.MessageBox");
$.sap.require("sap.secmon.ui.ssm.utils");
$.sap.require("sap.secmon.ui.ssm.Constants");
$.sap.require("sap.secmon.ui.ssm.SystemView");
$.sap.require("sap.secmon.ui.commons.EnumService");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.controller("sap.secmon.ui.ssm.Shell", {

    /**
     * Called when a controller is instantiated and its View controls (if available) are already created. Can be used to modify the View before it is displayed, to bind event handlers and do other
     * one-time initialization.
     * 
     * @memberOf Shell
     */

    onInit : function() {

        var thisController = this;

        // SID + Time Locale Model
        sap.secmon.ui.ssm.utils.createApplicationContextModelSync();
        var sSID = sap.ui.getCore().getModel('applicationContext').getProperty("/SID");

        var oShell = this.byId("shlMain");
        var oSelConfig, oSystemView;
        // assign the configs
        var oModel = new sap.ui.model.json.JSONModel();
        oModel.loadData("/sap/secmon/ui/ssm/defaultEtdLandscape.json", null, false);

        // display name model
        var oDisplayNamesModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(oDisplayNamesModel, sap.secmon.ui.ssm.Constants.C_SSM_MODEL.DISPLAYNAMES);

        var sService = "/sap/secmon/services/SSM.xsodata";
        var oODataModel = new sap.ui.model.odata.ODataModel(sService, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oODataModel.read("/DisplayNames", {
            urlParameters : [ "$format=json" ],
            success : function(oData, oResponse) {
                var aDisplayNames = JSON.parse(oResponse.body).d.results;
                // remove the redundent entries
                var aaDisplayNames = {};
                aDisplayNames.forEach(function(oDisplayName, idx) {
                    aaDisplayNames[oDisplayName.Category + "." + oDisplayName.Type] = oDisplayName.DisplayName;
                });
                oDisplayNamesModel.setData(aaDisplayNames);
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });

        // oSelConfig = this.getView().byId("dbSelConfig");
        // oSelConfig.setModel(oModel);
        // oSelConfig.bindItems("/configs", new sap.ui.core.ListItem({
        // key : "{Id}",
        // text : "{Name}"
        // }));

        var sViewMode = $.sap.getUriParameters().get('view');
        oModel.setProperty("/viewMode", sViewMode);

        switch (sViewMode) {
        case sap.secmon.ui.ssm.Constants.C_SSM_VIEW_MODE.NOTES:
            oSelConfig = this.getView().byId("dbSelConfig");
            oSelConfig.setVisible(true);
            oSelConfig.setModel(oModel);
            oSelConfig.bindItems("/notes", new sap.ui.core.ListItem({
                key : "{Id}",
                text : "{Name}"
            }));

            // oSelConfig.setSelectedKey("CurrentSecurityNotes");
            oSelConfig.setSelectedKey("Unpatched");
            oSelConfig.attachChange(function(oEvent) {
                var sKey = oEvent.getParameter("selectedItem").getKey();

                showSecurityNotes(sKey, oShell);

            });

            showSecurityNotes("UnpatchedSystem", oShell);

            function showSecurityNotes(sKey, oShell) {
                var aSystemViews = [];
                thisController._getSecurityNotes(sKey, function(sKey, aNotes) {
                    // thisController.getSecurityNotes(function(aNotes) {
                    aNotes.forEach(function(oNote, i) {
                        // oNote.Id = oNote.NoteNumber;
                        oNote.Status = oNote.ValidityStatus;
                        var oFilter = {
                            entity : {
                                id : "RelatedObjects",
                                keys : [ {
                                    name : "SourceId",
                                    value : oNote.Id
                                } ],
                                properties : oNote
                            },
                            relation : {
                                name : sKey
                            }
                        };
                        var oSystemView = new sap.secmon.ui.ssm.SystemView({
                            // height : "600px",
                            viewMode : sViewMode
                        })._prepareData(oFilter);

                        oSystemView.getHistory().push(oFilter);
                        aSystemViews.push(oSystemView);
                    });

                    oShell.setContent(new sap.ui.layout.VerticalLayout({
                        width : "100%",
                        content : aSystemViews
                    }));
                });
            }
            oShell.setAppTitle(oTextBundle.getText("SSM_Notes_Shell_Title"));
            jQuery(document).attr("title", "[" + sSID + "] " + oTextBundle.getText("SSM_Notes_Window_Title"));
            break;
        case sap.secmon.ui.ssm.Constants.C_SSM_VIEW_MODE.SYSTEMS: // Fallthru is intensionally!
            oSelConfig = this.getView().byId("dbSelConfig");
            oSelConfig.setVisible(false);
        default:
            oShell.setAppTitle(oTextBundle.getText("SSM_Systems_Shell_Title"));
            jQuery(document).attr("title", "[" + sSID + "] " + oTextBundle.getText("SSM_Systems_Window_Title"));

            // convert data for the UI
            var oFilter = {
                entity : {
                    id : "RelatedObjects",
                    keys : [ {
                        name : "SourceId",
                        value : "Landscapes"
                    } ],
                    properties : undefined
                },
            // relation : {
            // name : "SubSystem"
            // }
            };
            oSystemView = new sap.secmon.ui.ssm.SystemView({
                viewMode : sViewMode
            });
            oSystemView.getHistory().push(oFilter);
            oSystemView._prepareData(oFilter);

            oShell.setContent(oSystemView);
        }
        /*
         * oSelConfig.setSelectedKey("TopLevelSystems"); oSelConfig.attachChange(function(oEvent) { var oSrc = oEvent.getSource(); var sKey = oEvent.getParameter("selectedItem").getKey();
         * 
         * if (sKey === "CurrentSecurityNotes") { var aSystemViews = []; thisController.getSecurityNotes(function(aNotes) { aNotes.forEach(function(oNote, i) { // oNote.Id = oNote.NoteNumber;
         * oNote.Status = oNote.ValidityStatus; var oFilter = { entity : { id : "RelatedObjects", keys : [ { name : "SourceId", value : oNote.Id } ], properties : oNote }, relation : { name :
         * "UnpatchedSystem" } } var oSystemView = new sap.secmon.ui.ssm.SystemView({ height : "800px" })._prepareData(oFilter);
         * 
         * oSystemView.getHistory().push(oFilter);
         * 
         * aSystemViews.push(oSystemView);
         * 
         * oShell.setContent(new sap.ui.layout.VerticalLayout({ width : "100%", content : aSystemViews })); }); }); } else { // convert data for the UI var oFilter = sKey == "TopLevelSystems" ? {
         * entity : { id : "RelatedObjects", keys : [ { name : "SourceId", value : "TopLevelSystems" } ], properties : undefined }, relation : { name : "SubSystem" } } : { entity : { id : sKey,
         * properties : undefined }, }; oSystemView = new sap.secmon.ui.ssm.SystemView(); oSystemView.getHistory().push(oFilter); oSystemView._prepareData(oFilter);
         * 
         * oShell.setContent(oSystemView); } });
         */
        // apply compact density if touch is not supported, the standard cozy
        // design otherwise
        this.getView().addStyleClass(sap.ui.Device.support.touch ? "sapUiSizeCozy" : "sapUiSizeCompact");

        var notificationBar = this.byId("shlMain").getNotificationBar();
        notificationBar.getMessageNotifier().setTitle(oTextBundle.getText("BU_TIT_NotificationBar"));
        this.setNotifierIcon();
    },

    aaRelationMap : {
        "UnpatchedSystem" : "MissingSecurityNote",
        "PatchedSystem" : "ImplementedSecurityNote",
        "System" : "SecurityNote"
    },

    _getSecurityNotes : function(sKey, fnCallback) {

        var that = this;
        var sService = "/sap/secmon/services/SSM.xsodata";
        var oMainSysODataModel = new sap.ui.model.odata.ODataModel(sService, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oMainSysODataModel.read("/RelatedObjects", {
            urlParameters : [ "$format=json" ],
            filters : [ new sap.ui.model.Filter({
                path : "Relation",
                operator : sap.ui.model.FilterOperator.EQ,
                value1 : that.aaRelationMap[sKey],
            }) ],
            success : function(oData, oResponse) {
                var aSystems = JSON.parse(oResponse.body).d.results;
                // remove the redundent entries
                var aaSystems = {};
                aSystems.forEach(function(oSystem, idx) {
                    oSystem.Health = +oSystem.Health;
                    oSystem.Criticality = +oSystem.Criticality;
                    aaSystems[oSystem.Id] = oSystem;
                });
                var aSortedSystems = [];
                for ( var prop in aaSystems) {
                    aSortedSystems.push(aaSystems[prop]);
                }

                // sorting accoprding to SoC value
                aSortedSystems.sort(function(a, b) {
                    if (a.Health > b.Health) {
                        return -1;
                    }
                    if (a.Health < b.Health) {
                        return +1;
                    }

                    return 0;
                });

                // sort according to their SoC scores

                // aSystems.reduce(function(a, b) {
                // if (a.indexOf(b) < 0)
                // a.push(b);
                // }, []);
                fnCallback(sKey, aSortedSystems);
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });
    },

    /*
     * deprecated!
     */
    getSecurityNotesOld : function(fnCallback) {

        var sService = "/sap/secmon/services/SSM.xsodata";
        var oMainSysODataModel = new sap.ui.model.odata.ODataModel(sService, {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        oMainSysODataModel.read("/TopLevelSecurityNotes", {
            urlParameters : [ "$format=json" ],
            success : function(oData, oResponse) {
                var aSystems = JSON.parse(oResponse.body).d.results;
                fnCallback(aSystems);
            },
            error : function(oError) {
                sap.secmon.ui.ssm.utils.getController().reportNotification(sap.ui.core.MessageType.Error, oError.message);
            }
        });
    },

    onShowHelp : function(oEvent) {
        var sViewMode = $.sap.getUriParameters().get('view');
        var sLink = "/sap/secmon/help/" + (sViewMode === sap.secmon.ui.ssm.Constants.C_SSM_VIEW_MODE.NOTES ? "04f0836f1e0945ad889816ad68a9d09c" : "b80529dc00044e1e9982afaedd92735c") + ".html";
        window.open(sLink);
    },

    /*
     * when a user clicks on a message, remove it from the notifier
     */
    onMessageSelected : function(oEvent) {

        var notifier = oEvent.getParameters().notifier;
        var message = oEvent.getParameters().message;
        notifier.removeMessage(message);
        message.destroy();
        this.setNotifierIcon();
    },

    setNotifierIcon : function() {

        var notifier = this.byId("shlMain").getNotificationBar().getMessageNotifier();
        var icon = "ui/img/hint.png";

        var messages = notifier.getMessages();

        for (var i = 0, len = messages.length; i < len; i++) {
            switch (messages[i].getLevel()) {
            case sap.ui.core.MessageType.Error:
                icon = "ui/img/error.png";
                break;
            case sap.ui.core.MessageType.Warning:
                icon = "ui/img/warning.png";
                break;
            }

            if (icon === "ui/img/error.png") {
                break;
            }
        }

        notifier.setIcon(icon);
    },

    reportNotification : function(level, text) {

        var icon = "ui/img/hint.png";

        switch (level) {
        case sap.ui.core.MessageType.Error:
            icon = "ui/img/error.png";
            break;
        case sap.ui.core.MessageType.Warning:
            icon = "ui/img/warning.png";
            break;
        }

        var date = new Date();
        var message = new sap.ui.core.Message({
            text : text,
            icon : icon,
            timestamp : date.toLocaleString(),
            level : level
        });

        var notificationBar = this.byId("shlMain").getNotificationBar();
        notificationBar.getMessageNotifier().addMessage(message);
        if (notificationBar.getVisibleStatus() === sap.ui.ux3.NotificationBarStatus.None || notificationBar.getVisibleStatus() === sap.ui.ux3.NotificationBarStatus.Min) {
            notificationBar.setVisibleStatus(sap.ui.ux3.NotificationBarStatus.Default);
        }

        this.setNotifierIcon();
    },

    shlUILogout : function(oEvent) {

        requestWithXCSRF({
            url : "/sap/secmon/services/logout.xscfunc",
            type : "POST",
            success : function(ret) {
                document.location.reload(true);
            }
        });

        function requestWithXCSRF(ioRequest) {
            $.ajax({
                type : "GET",
                url : "/sap/secmon/services/token.xsjs",
                headers : {
                    "X-CSRF-Token" : "Fetch"
                },
                success : function(data, textStatus, jqXHR) {
                    var securityToken = jqXHR.getResponseHeader("X-CSRF-Token");
                    if (ioRequest.headers) {
                        ioRequest.headers['X-CSRF-Token'] = securityToken;
                    } else {
                        ioRequest.headers = {};
                        ioRequest.headers['X-CSRF-Token'] = securityToken;
                    }
                    $.ajax(ioRequest);
                },
                error : function(XMLHttpRequest, textStatus, errorThrown) {
                }

            });
        }
    }

});
