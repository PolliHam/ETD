jQuery.sap.require("sap.secmon.ui.m.commons.EtdController");

describe("EtdController", function() {
    describe("Button enablement depending on table selection", function() {
        var oButton1 = {
            setEnabled : function() {
            }
        };
        var oButton2 = {
            setEnabled : function() {
            }
        };
        var oView = {
            byId : function(id) {
                if (id === "button1") {
                    return oButton1;
                }
                if (id === "button2") {
                    return oButton2;
                }
            }
        };
        var oTable = {
            attachUpdateFinished : function(oListener) {
                this.oUpdateFinishedListener = oListener;
            },
            attachSelectionChange : function(oListener) {
                if (arguments.length === 1) {
                    this.oListener = oListener;
                } else if (arguments.length >= 2) {
                    for(var i=0; i<arguments.length; i++) {
                        if (typeof arguments[i] === "function") {
                            this.oListener = arguments[i];
                        }
                    }
                }
            },
            attachRowSelectionChange : function(oListener) {
                if (arguments.length === 1) {
                    this.oListener = oListener;
                } else if (arguments.length >= 2) {
                    for(var i=0; i<arguments.length; i++) {
                        if (typeof arguments[i] === "function") {
                            this.oListener = arguments[i];
                        }
                    }
                }
            },
            triggerSelectionChange : function(aSelectedItems) {
                this.aSelectedItems = aSelectedItems;
                this.oListener();
            },
            triggerUpdateFinished : function() {
                this.oUpdateFinishedListener();
            },
            getSelectedItems : function() {
                return this.aSelectedItems;
            }
        };

        var oController;

        function setupSpies() {
            oController = sap.ui.controller("sap.secmon.ui.m.commons.EtdController");
            oController.getView = function() {
                return oView;
            };

            oButton1 = jasmine.createSpyObj(oButton1, ["setEnabled"]);
            oButton2 = jasmine.createSpyObj(oButton2, ["setEnabled"]);
        }

        describe("enableButtonsIfExactlyOneRowIsSelected", function() {

            beforeEach(function() {
                setupSpies();
            });

            it("should enable button if one row is selected", function() {
                oController.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "button1", "button2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(false);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(false);
                oTable.triggerSelectionChange([ "row1" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(true);
            });

            it("should enable button if one row is selected (triggered by table update)", function() {
                oController.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "button1", "button2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(false);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(false);
                oTable.triggerUpdateFinished();
                expect(oButton1.setEnabled).toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(true);
            });
            
            it("should not enable button if two rows are selected", function() {
                oController.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "button1", "button2" ]);
                oTable.triggerSelectionChange([ "row1", "row2" ]);
                expect(oButton1.setEnabled).not.toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).not.toHaveBeenCalledWith(true);
            });

            it("should not enable button if no row is selected", function() {
                oController.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "button1", "button2" ]);
                oTable.triggerSelectionChange([]);
                expect(oButton1.setEnabled).not.toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).not.toHaveBeenCalledWith(true);
            });
        });

        describe("enableButtonsIfAtLeastOneRowIsSelected", function() {

            beforeEach(function() {
                setupSpies();
            });

            it("should enable button if one row is selected", function() {
                oController.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "button1", "button2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(false);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(false);
                oTable.triggerSelectionChange([ "row1" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(true);
            });

            it("should enable button if two rows are selected", function() {
                oController.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "button1", "button2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(false);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(false);
                oTable.triggerSelectionChange([ "row1", "row2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(true);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(true);
            });
        });
        
        describe("clearTableSelectionAndDisableButtons", function() {

            beforeEach(function() {
                setupSpies();
                oTable = jasmine.createSpyObj(oTable, ["removeSelections"]);
            });

            it("should clear table selection and disable buttons", function() {
                oController.clearTableSelectionAndDisableButtons(oTable, [ "button1", "button2" ]);
                expect(oButton1.setEnabled).toHaveBeenCalledWith(false);
                expect(oButton2.setEnabled).toHaveBeenCalledWith(false);
                expect(oTable.removeSelections).toHaveBeenCalled();
            });
        });
    });

    describe("Button enablement depending on table selection - using ui5 views", function() {

        jQuery.sap.require("sap.m.Table");
        jQuery.sap.require("sap.m.Button");
        jQuery.sap.require("sap.m.ColumnListItem");
        jQuery.sap.require("sap.m.Text");
        jQuery.sap.require("sap.ui.layout.form.SimpleForm");
        jQuery.sap.require("sap.m.ListMode");

        sap.ui.jsview("etd", {
            getControllerName : function() {
                return "etd";
            },

            createContent : function(oController) {
                var table = new sap.m.Table(this.createId("theTable"), {
                    columns : [new sap.m.Column({
                        header : new sap.m.Text({text : ""})
                    })],
                    items : [new sap.m.ColumnListItem(this.createId("itemA"), {
                        cells : [new sap.m.Text({text : "a"})]
                    }),new sap.m.ColumnListItem(this.createId("itemB"), {
                        cells : [new sap.m.Text({text : "b"})]
                    }) ],
                    mode : sap.m.ListMode.MultiSelect
                });
                var buttonA = new sap.m.Button(this.createId("buttonA"), {
                    text : "press A"
                });
                var buttonB = new sap.m.Button(this.createId("buttonB"), {
                    text : "press B"
                });
                var buttonC = new sap.m.Button(this.createId("buttonC"), {
                    text : "press C"
                });
                return new sap.ui.layout.form.SimpleForm({
                    content : [table, buttonA, buttonB, buttonC]
                });
            }
        });

        sap.secmon.ui.m.commons.EtdController.extend("etd", {
            onInit : function() {
                var oTable = this.getView().byId("theTable");
                this.enableButtonsIfExactlyOneRowIsSelected(oTable, [ "buttonA" ]);
                this.enableButtonsIfAtLeastOneRowIsSelected(oTable, [ "buttonB", "buttonC" ]);
            }
        });

        describe("check enabling of buttons depending the number of selected items", function() {
            var view;
            var controller;
            var table;
            var buttonA;
            var buttonB;
            var buttonC;
            var itemA;
            var itemB;

            beforeEach(function() {
                view = sap.ui.jsview("etd");
                controller = view.getController();

                table = view.byId("theTable");
                buttonA = view.byId("buttonA");
                buttonB = view.byId("buttonB");
                buttonC = view.byId("buttonC");

                itemA = view.byId("itemA");
                itemB = view.byId("itemB");
            });


            it("should enable all buttons if one row is selected", function() {
                expect(buttonA.getEnabled()).toBeFalsy();
                expect(buttonB.getEnabled()).toBeFalsy();
                expect(buttonC.getEnabled()).toBeFalsy();

                itemA.setSelected(true);
                table.fireSelectionChange({ listItem : itemA, listItems : [], selected : true});

                expect(buttonA.getEnabled()).toBeTruthy();
                expect(buttonB.getEnabled()).toBeTruthy();
                expect(buttonC.getEnabled()).toBeTruthy();
            });

            it("should enable buttonB and buttonC if two rows are selected", function() {
                itemA.setSelected(true);
                itemB.setSelected(true);
                table.fireSelectionChange({ listItem : itemA, listItems : [itemA, itemB], selected : true});

                expect(buttonA.getEnabled()).toBeFalsy();
                expect(buttonB.getEnabled()).toBeTruthy();
                expect(buttonC.getEnabled()).toBeTruthy();
            });

        });


    });

    describe("test of text utility functions", function() {
        var data = {
            THEY_ARE_GREEN : "{0} and {1} are green"
        };
        var oModel = {
                data : {
                    THEY_ARE_GREEN : "{0} and {1} are green"
                },

                getProperty : function(prop) {
                    return this.data[prop];
                },
                getResourceBundle : function() {
                    return {
                        getText : function(prop) {
                            return data[prop];
                        }
                    }
                }

            };
        
        var component = new sap.ui.core.Component("Compo");
        component.setModel(oModel, "i18n");
        
        sap.ui.jsview("i18n", {
            getControllerName : function() {
                return "i18n";
            },

            createContent : function() {
                return null;
            }
        });
        

        sap.secmon.ui.m.commons.EtdController.extend("i18n", {
            onInit : function() {
            },
            
            getComponent: function(){
            	return component;
            }
        });



        var view;
        var controller;

        var FORMAT_OF_THEY_ARE_GREEN;

        beforeEach(function() {
            view = sap.ui.jsview("i18n");
            view.setModel(oModel, "i18n");
            controller = view.getController();

            FORMAT_OF_THEY_ARE_GREEN = controller.getText("THEY_ARE_GREEN");
        });

        it("should return the raw text", function() {
            expect(FORMAT_OF_THEY_ARE_GREEN).toBe("{0} and {1} are green");
        });

        it("should not format the text as no parameters were specified", function() {
            var result = controller.i18nText(FORMAT_OF_THEY_ARE_GREEN);
            expect(result).toBe("{0} and {1} are green");
        });

        it("should format the text partially", function() {
            var result = controller.i18nText(FORMAT_OF_THEY_ARE_GREEN, "Apples");
            expect(result).toBe("Apples and {1} are green");
        });

        it("should format the text completely", function() {
            var result = controller.i18nText(FORMAT_OF_THEY_ARE_GREEN, "Apples", "Bananas");
            expect(result).toBe("Apples and Bananas are green");
        });

        it("should only format as many arguments as the format requires", function() {
            var result = controller.i18nText(FORMAT_OF_THEY_ARE_GREEN, "Apples", "Bananas", "Chilis");
            expect(result).toBe("Apples and Bananas are green");
        });
    });

});
