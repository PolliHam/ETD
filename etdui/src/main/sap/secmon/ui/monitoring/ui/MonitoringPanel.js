/* globals oTextBundle */
$.sap.declare("sap.secmon.ui.monitoring.MonitoringPanel");
$.sap.require("sap.secmon.ui.commons.CommonFunctions");
$.sap.require("sap.secmon.ui.browse.Chart");
$.sap.require("sap.secmon.ui.browse.PatternDefinition");
$.sap.require("sap.secmon.ui.m.commons.NavigationService");
$.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.ui.model.odata.CountMode");

var oDateFormatterEx = sap.secmon.ui.commons.Formatter;

var C_CONTEXT = {
    ALERT : "Alert",
    LOG : "Log",
    INVESTIGATION : "Investigation",
    ANOMALY : "Anomaly",
    HEALTHCHECK : "HealthCheck"
};

var C_SYSTEM_ID_LOG_KEY = "53CDE60D0DC572EEE10000000A4CF109";
var C_SYSTEM_ID_ALERT_KEY = "53EE56541AA9066CE10000000A4CF109";
var C_SYSTEM_ID_HC_KEY = "547DF3D6DD747331E10000000A4CF109";

var C_TERMINAL_ID_LOG_KEY = "53CDE6170DC572EEE10000000A4CF109";
var C_TERMINAL_ID_ALERT_KEY = "53EE56551AA9066CE10000000A4CF109";

var C_PSEUDONYM_ALERT_KEY = "5418799227B72F66E10000000A4CF109";
var C_SOURCE_USER_PSEUDONYM = "53D8FCF497FB1B2EE10000000A4CF109";

/**
 * A panel in the monitoring page
 * 
 * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
 */
sap.ui.commons.Panel.extend("sap.secmon.ui.monitoring.MonitoringPanel", {
    metadata : {
        properties : {
            chartId : {
                type : "string"
            },
            monPageConfigId : {
                type : "string"
            },
            chartRefreshInterval : {
                type : "int",
                "default" : "30000"
            },
            showCollapseIcon : {
                type : "boolean",
                "default" : false
            },
            period : {
                type : "object",
                "default" : null
            },
            alertId : {
                type : "string",
                multiple : false
            },
            filters : {
                type : "object",
                multiple : true
            }
        },
        aggregations : {
            // Override derived aggregations buttons, to allow also other ui
            // elements beside of sap.ui.commons.Button
            buttons : {
                type : "sap.ui.core.Control",
                multiple : true
            }
        },
        events : {
            "chartSelected" : {},
            "chartMaximized" : {},
            "chartMinimized" : {}
        }
    },

    /**
     * Dropdown and embedded listbox containing the charts/patterns of the workspace
     * 
     * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
     */
    oDropdownBox : undefined,
    oListBox : undefined,
    oChartData : undefined,
    oCommonFunctions : undefined,
    bChartIdChanged : undefined,
    oButtonNavigate : undefined,
    oButtonConfigure : undefined,

    /**
     * Embedded chart
     * 
     * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
     */
    oChart : undefined,

    renderer : {},

    init : function() {
        var that = this;

        // Call super constructor
        if (sap.ui.commons.Panel.prototype.init) {
            sap.ui.commons.Panel.prototype.init.apply(this, arguments);
        }

        // Subscribe to chart events
        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXPAND_CHART, function(sChannelId, sEventId, aParams) {
            if (aParams[0].getId() === that.oChart.getId()) {
                that.fireChartMaximized({
                    chart : that.oChart
                });
            }
        });
        sap.ui.getCore().getEventBus().subscribe(sap.secmon.ui.browse.Constants.C_ETD.EVENT_CHANNEL, sap.secmon.ui.browse.Constants.C_ETD.EVENT_EXIT_FULL_SCREEN,
            function(sChannelId, sEventId, aParams) {
                if (aParams[0].getId() === that.oChart.getId()) {
                    that.fireChartMinimized({
                        chart : that.oChart
                    });
                }
            });

        this.bChartIdChanged = true;

        var oModel = new sap.ui.model.odata.ODataModel("/sap/secmon/services/monitoringPage.xsodata", {
            json : true,
            defaultCountMode : sap.ui.model.odata.CountMode.Inline
        });
        this.setModel(oModel, "MonitoringPageModel");
        var oListBoxModel = new sap.ui.model.json.JSONModel();
        this.setModel(oListBoxModel, "ListBoxModel");

        var oDropDownModel = new sap.ui.model.json.JSONModel({
            selectedChartBinKey : ""
        });
        this.setModel(oDropDownModel, "DropDownModel");



        this.oDropdownBox = new sap.m.ComboBox({
            showSecondaryValues : true,
            width : "15em",
            selectedKey : "{DropDownModel>/selectedChartBinKey}",
            selectionChange : [ this.onSelectChart, this ],
            items : {
                path : "/d/results",
                model : "ListBoxModel",
                template : new sap.ui.core.ListItem({
                    text : "{ListBoxModel>Name}",
                    additionalText : "{ListBoxModel>Namespace}",
                    key : "{ListBoxModel>Id}",
                    tooltip : {
                        parts : [ "Name", "Namespace", "Description" ],
                        model : "ListBoxModel",
                        formatter : function(sName, sNamespace, sDescription) {
                            return sName + " {" + sNamespace + "}\n\n" + sDescription;
                        }
                    }
                })
            }
        }).setModel(oDropDownModel);
        this.oDropdownBox.addStyleClass("sapUiSizeCompact");

        // Create chart
        this.oChart = new sap.secmon.ui.browse.Chart({
            refreshMode : {
                mode : "none"
            }
        });

        // Create buttons
        this.oButtonNavigate = new sap.m.Button({
            icon : "sap-icon://action",
            lite : true,
            tooltip : "{i18n>MonOpenChartTt}",
            press : [ this.handleOpenChart, this ],
            type : "Transparent"
        });
        this.oButtonNavigate.addStyleClass("sapUiSizeCompact");

        this.oButtonConfigure = new sap.m.Button({
            icon : "sap-icon://wrench",
            lite : true,
            tooltip : "{i18n>MonConfigureChartTt}",
            press : [ this.handleQubeOpen, this ],
            type : "Transparent"
        });
        this.oButtonConfigure.addStyleClass("sapUiSizeCompact");

        // Add configure button
        this.addButton(this.oButtonConfigure);

        // Add chart as content
        this.addContent(this._createContentLayout());

        this.oCommonFunctions = new sap.secmon.ui.commons.CommonFunctions();

        // Set title
        this.setTitle(new sap.ui.core.Title({
            text : "(No Chart...)",
            tooltip : "(No Chart...)"
        }));

        this.addStyleClass("sapUiSizeCompact");
    },

    /**
     * Reads chart data before view gets rendered (all the properties are available now)
     * 
     * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
     */
    onBeforeRendering : function() {
        var that = this;
        // Call super implementation
        if (sap.ui.commons.Panel.prototype.onBeforeRendering) {
            sap.ui.commons.Panel.prototype.onBeforeRendering.apply(this, arguments);
        }

        if (this.bChartIdChanged && this.getChartId()) {
            // Read chart data
            this.readChart(this.getChartId());
           
            // Convert hex key to bin key and set it as selected key in dropdown
            // model
            this.getModel("DropDownModel").setProperty("/selectedChartBinKey", this.oCommonFunctions.hexToBase64(this.getChartId()));

            if (this._fnCountRefresher) {
                clearInterval(that._fnCountRefresher);
            }
            this._fnCountRefresher = setInterval(function() {
                that.readChart(that.getChartId(), true);
            }, that.getChartRefreshInterval());
        }
    },

    /**
     * Override default setter to set bChartIdChanged
     * 
     * @param sChartId
     *            New chart id in hex format
     * @returns {sap.secmon.ui.monitoring.MonitoringPanel}
     * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
     */
    setChartId : function(sChartId) {
        this.setProperty("chartId", sChartId);
        this.bChartIdChanged = true;
        return this; // return "this" to allow method chaining
    },

    /**
     * Handles the selection of a chart
     * 
     * @param oEvent
     * 
     * @memberOf sap.secmon.ui.monitoring.MonitoringPanel
     */
    onSelectChart : function(oEvent) {

        var sBinKey = oEvent.getParameter("selectedItem").getKey();
        var sHexKey = this.oCommonFunctions.base64ToHex(sBinKey);

        // Set new chart id
        this.setChartId(sHexKey);
    },
    /**
     * Reads a given Chart via OData service
     * 
     * @param sQubeId
     */
    readChart : function(sChartId, bRefresh) {
        var that = this, promise;
        that.setBusy(true);
        that.bChartIdChanged = false;

        var sid = this.getMonPageConfigId();

        if (that.getAlertId() && that.getAlertId().length > 0) {
            promise = sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/MonitoringPageService.xsjs?id=" + encodeURIComponent(sid) + 
                "&chartId=" + encodeURIComponent(sChartId) + "&alertId=" + encodeURIComponent(that.getAlertId()));
        } else {
            promise = sap.secmon.ui.browse.utils.postJSon("/sap/secmon/services/MonitoringPageService.xsjs?id=" + encodeURIComponent(sid) + 
                "&chartId=" + encodeURIComponent(sChartId));
        }
        promise.fail(function(jqXHR) {
            that.setBusy(false);
            var messageText = jqXHR.responseText;
            sap.ui.getCore().byId('idShell--shlMain').getParent().getController().reportNotification(sap.ui.core.MessageType.Error, messageText);
            that.setBusy(false);
        });
        promise.done(function(data) {
            var oData = data;
            that.oChartData = oData.Data.Charts.serializedData;

            // Adjust filters according to alert & parameters, if given
            that.addFilters();

            if (!bRefresh) {
                if (that.oChartData.type === "Pattern") {
                    that.oChart = new sap.secmon.ui.browse.PatternDefinition({
                        refreshMode : {
                            mode : "none"
                        }
                    });
                } else if (that.oChartData.type === "Chart") {
                    that.oChart = new sap.secmon.ui.browse.Chart({
                        refreshMode : {
                            mode : "none"
                        }
                    });
                } else {
                    that.oChart = new sap.secmon.ui.browse.Chart({
                        refreshMode : {
                            mode : "none"
                        }
                    });

                    that.oChart.destroy();
                }

                that.removeAllContent();

                that.addContent(that._createContentLayout(that.oChartData));

                var oPanelTitle;

                if (that.oChartData.name) {
                    oPanelTitle = new sap.ui.core.Title({
                        text : that.oChartData.name,
                        tooltip : that.oChartData.name + " {" + that.oChartData.namespace + "}\n\n" + that.oChartData.description
                    });
                }
                that.setTitle(oPanelTitle);

                // Add dropdown and buttons
                that.insertButton(that.oDropdownBox, 0);
                that.addButton(that.oButtonNavigate);

                // hide Chart title in chart
                var oChartUIModelData = that.oChart.getModel("UIModel").getData();
                oChartUIModelData.chartTitleVisible = false;
                oChartUIModelData.editChartTypeVisible = true;
                that.oChart.getModel("UIModel").setData(oChartUIModelData);
                that.getModel("ListBoxModel").loadData("/sap/secmon/services/monitoringPage.xsodata/Qube?$filter=ParentId eq X'" + that.oChartData.parentId + "'");
            }

            that.oChart.getModel().setData(that.oChartData);
            that.oChart.newDataAvailable();

            that.setBusy(false);
        });

    },
    /**
     * Is invoked when the user navigates to the workspace of a shown chart/pattern
     * 
     * @param oEvent
     */
    handleOpenChart : function(oEvent) {
        var sLanguage = sap.secmon.ui.m.commons.NavigationService.getLanguage();
        window.open("/sap/secmon/ui/browse/?Id=" + this.getChartId() + sLanguage);
    },

    /**
     * Is invoked when user wants clicks the personalization icon in the upper right of each chart panel. Configuration of the monitoring page is handled here
     * 
     * @param oEvent
     */
    handleQubeOpen : function(oEvent) {

        // Destroy Qube dialog, if already instantiated
        // This is needed to store the correct current sChartId
        // below
        if (this._oOpenQubeDialog) {
            this._oOpenQubeDialog.destroy();
            this._oOpenQubeDialog = null;
        }

        var that = this;

        // create a dummy Controller for the action in the
        // Dialog
        var oDummyController = {
            pressedChooseArtifact : function(oEvent) {
                var sChartId = sap.ui.getCore().getModel("MonitoringModel").getData().selectedChartId;
                if (!sChartId || sChartId === "") {
                    sap.ui.commons.MessageBox.show(oTextBundle.getText("MonSelectFirst"), sap.ui.commons.MessageBox.Icon.INFORMATION, oTextBundle.getText("MonSelectChart"));
                    return;
                }

                that._oOpenQubeDialog.close();

                that.setChartId(sChartId);

                that.fireChartSelected({
                    newChartId : sChartId
                });
            },

            pressedClose : function() {
                that._oOpenQubeDialog.close();
            }
        };

        this._oOpenQubeDialog = sap.ui.xmlfragment("dlWSOpen", "sap.secmon.ui.monitoring.OpenArtifact", oDummyController);
        this._oOpenQubeDialog.open();
    },

    addFilters : function() {
        var that = this;

        // Override period according to parameters, if set
        if (that.getPeriod()) {
            that.oChartData.period = that.getPeriod();
        }
    },

    _invalidDateParser: function(sDate){
        var sPeriodIndex, sPeriod;
        if(sDate){
            var sParseDate = sDate.split(/(?=[A-Z]+|[0-9])/g); 
            
            if(sParseDate.length === 3){
              sPeriodIndex = sParseDate[1];
              sPeriod = sParseDate[2];
            }else{
                sPeriod = sParseDate[1];
            }
            
            // Getting period translation
            switch(sPeriod.toUpperCase()){
              case "MINUTE" || "MINUTES":
                sPeriod = oTextBundle.getText("MonMinute");
                break;
              case "HOUR" || "HOURS":
                sPeriod = oTextBundle.getText("MonHour");
                break;
              case "DAY" || "DAYS":
                sPeriod = oTextBundle.getText("MonDay");
                break;
              case "WEEK" || "WEEKS":
                sPeriod = oTextBundle.getText("MonWeek");
                break;
              case "MONTH" || "MONTHS":
                sPeriod = oTextBundle.getText("MonMonth");
                break;                   
            }

            sDate = [oTextBundle.getText("MonLast"), sPeriodIndex, sPeriod].join(" ");

        }        
        return sDate;                
    },

    _createContentLayout : function(oChartData) {
        var oLayout = new sap.ui.commons.layout.MatrixLayout({
            columns : 1,
            layoutFixed : true,
            width : "100%",
            height : "100%"
        });

        var sFrom = oTextBundle.getText("MonUnknown"),
            sTo = oTextBundle.getText("MonUnknown"),
            oDate;

        if (oChartData) {
            oDate = new Date(oChartData.period.searchTerms[0]);
            if (oDate === "Invalid Date") {                
                sFrom = this._invalidDateParser(oChartData.period.searchTerms[0]);
            } else {
                sFrom = oDateFormatterEx.dateFormatterEx("applicationContext>/UTC", oDate);
            }

            oDate = new Date(oChartData.period.searchTerms[1]);
            if (oDate === "Invalid Date") {             
               sTo = this._invalidDateParser(oChartData.period.searchTerms[1]);
            } else {
                sTo = oDateFormatterEx.dateFormatterEx("applicationContext>/UTC", oDate);
            }
        }

        var oTextViewFrom = new sap.ui.commons.TextView({
            text : sFrom
        }).addStyleClass("monitoringPanelPeriod");
        var oTextViewTo = new sap.ui.commons.TextView({
            text : sTo
        }).addStyleClass("monitoringPanelPeriod");
        var oLabelPeriod = new sap.ui.commons.TextView({
            text : "{i18n>MonPeriod}"
        }).addStyleClass("monitoringPanelPeriod");

        var oTextViewHyphen = new sap.ui.commons.TextView({
            text : "-"
        }).addStyleClass("monitoringPanelPeriod");

        if (sTo !== "" && sTo !== undefined) {
            oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
                height : "50px",
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    content : [ oLabelPeriod, oTextViewFrom, oTextViewHyphen, oTextViewTo ]
                }) ]
            }));
        } else {
            oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
                height : "50px",
                cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                    content : [ oLabelPeriod, oTextViewFrom ]
                }) ]
            }));
        }
        oLayout.addRow(new sap.ui.commons.layout.MatrixLayoutRow({
            height : "100%",
            cells : [ new sap.ui.commons.layout.MatrixLayoutCell({
                content : this.oChart
            }) ]
        }));

        return oLayout;
    }
});