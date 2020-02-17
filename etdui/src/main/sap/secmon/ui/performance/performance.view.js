/* globals oTextBundle */
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");

sap.ui.jsview("sap.secmon.ui.performance.performance", {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),

    /**
     * Specifies the Controller belonging to this View. In the case that it is not implemented, or that "null" is returned, this View does not have a Controller.
     * 
     * @memberOf views.Companies
     */
    getControllerName : function() {
        return "sap.secmon.ui.performance.performance";
    },

    // test

    /**
     * Is initially called once after the Controller has been instantiated. It is the place where the UI is constructed. Since the Controller is given to this method, its event handlers can be
     * attached right away.
     * 
     * @memberOf views.Companies{
     */
    createContent : function(oController) {
        this.oModel = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(this.oModel, 'PerfData');
        var oSystemViz = new sap.secmon.ui.performance.SystemViz({
            id : "systemViz",
            dataSelected : oController.onSelectData,
        });
        oSystemViz.setModel(sap.ui.getCore().getModel("PerfData"));

        this.oModelEsp = new sap.ui.model.json.JSONModel();
        sap.ui.getCore().setModel(this.oModelEsp, 'EspData');
        var oEspViz = new sap.secmon.ui.performance.EspViz({
            id : "espViz",
            dataSelected : oController.onSelectData,
        });
        oEspViz.setModel(sap.ui.getCore().getModel("EspData"));

        var oShell = new sap.m.Shell(this.createId("Shell"), {
            app : new sap.m.Page({
                title : oTextBundle.getText("PE_Calibration"),
                content : [ new sap.ui.layout.Grid({
                    defaultSpan : "L12 M12 S12",
                    position : "Center",
                    content : [ new sap.m.Text({
                        // content : [ new sap.m.Label({
                        id : "RessourceOverview",
                        text : oTextBundle.getText("PE_ResourceOverviewLabel")
                    }), new sap.ui.layout.form.SimpleForm({
                        minWidth : 1024,
                        maxContainerCols : 1,
                        layout : "ResponsiveGridLayout",
                        labelSpanL : 9,
                        labelSpanM : 9,
                        content : [ new sap.ui.core.Title({
                            text : oTextBundle.getText("PE_FormTitle")
                        }),
                        // Throughput
                        new sap.m.VBox({
                            items : [ new sap.m.Label({
                                id : "ThroughputState",
                                text : oTextBundle.getText("PE_ThroughputLabel")
                            }), new sap.m.HBox({
                                items : [ new sap.m.Input(this.createId("Input"), {
                                    value : "",
                                    enabled : "{applicationContext>/userPrivileges/performanceWrite}",
                                    width : "100px"
                                }), new sap.m.Button({
                                    id : "ThroughputButton",
                                    text : oTextBundle.getText("PE_OK_Button"),
                                    visible : "{applicationContext>/userPrivileges/performanceWrite}",
                                    width : "100px",
                                    press : [ oController.okPressed, oController ]
                                }) ]
                            }), new sap.m.HBox({
                                items : [ new sap.m.Button({
                                    id : "DeleteTestLogs",
                                    text : oTextBundle.getText("PE_DELETE_LOGS_Button"),
                                    width : "200px",
                                    visible : "{applicationContext>/userPrivileges/performanceWrite}",
                                    press : [ oController.okPressed, oController ]
                                }), new sap.m.Button({
                                    id : "DeleteTestResults",
                                    text : oTextBundle.getText("PE_DELETE_RESULTS_Button"),
                                    visible : "{applicationContext>/userPrivileges/performanceWrite}",
                                    width : "200px",
                                    press : [ oController.okPressed, oController ]
                                }) ]
                            })

                            ]
                        // items from VBox
                        }),

                        // Storage
                        new sap.ui.core.Title({
                            text : oTextBundle.getText("PE_FormTitleStorage")
                        }), new sap.m.VBox({
                            items : [ new sap.m.Label({
                                id : "StorageState",
                                text : oTextBundle.getText("PE_StorageLabel")
                            }), new sap.m.HBox({
                                items : [ new sap.m.Input(this.createId("InputStorage"), {
                                    value : "",
                                    width : "100px",
                                    enabled : "{applicationContext>/userPrivileges/settingsManageEventStorageWrite }"
                                }), new sap.m.Button({
                                    id : "StorageButton",
                                    text : oTextBundle.getText("PE_OK_Button"),
                                    width : "100px",
                                    visible : "{applicationContext>/userPrivileges/settingsManageEventStorageWrite }",
                                    press : [ oController.okPressed, oController ]
                                }) ]
                            }) // HBox
                            ]
                        // items from VBox
                        }) ]
                    })

                    ]
                }) ]
            })
        });
        oShell.getApp().addContent(oSystemViz.mLayout);
        oShell.getApp().addContent(new sap.ui.layout.Grid({
            defaultSpan : "L12 M12 S12",
            position : "Center",
            content : [ new sap.m.Text({
                // content : [ new sap.m.Label({
                id : "RessourceOverviewEsp",
                text : oTextBundle.getText("PE_ResourceOverviewLabel")
            }) ]
        }));

        oShell.getApp().addContent(oEspViz.mLayout);
        oShell.setModel(this.oModel);

        return oShell;

    },

    dateFormatter : function(fValue) {
        jQuery.sap.require("sap.ui.core.format.DateFormat");
        var sPattern = new sap.ui.model.type.DateTime({
            style : "medium"
        }).getOutputPattern();
        var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
            pattern : sPattern
        });
        return oDateFormat.format(new Date(fValue));
    },
}

);
