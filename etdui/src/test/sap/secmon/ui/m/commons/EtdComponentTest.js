jQuery.sap.require("sap.secmon.ui.m.commons.EtdComponent");

var libUnderTest;

describe("Checking EtdCompoment", function() {
    var odataModel;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.commons.EtdComponent;
        createSpies();
    });

    afterEach(function() {
    });

    function createSpies() {
        odataModel = jasmine.createSpyObj("odataModel", [ "attachRequestFailed" ]);
        spyOn(sap.ui.model.odata, [ "ODataModel" ]).and.returnValue(odataModel);

    }
    it("Check, if EtdComponent cannot be initialized without resource bundle", function() {
        expect(function() {
            var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {});
            var comp = new testComp();
        }).toThrow();
    });
    it("Check, if EtdComponent can be initilated with a resourceBundle", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        expect(function() {
            var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
                metadata : {
                    config : {
                        resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
                    }
                }
            });
            var comp = new testComp();
        }).not.toThrow();
    });

    it("Check, if i18n model is filled correctly", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty", "getResourceBundle" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {
                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
                }
            }
        });
        var comp = new testComp();
        expect(comp.getModel("i18n")).not.toBeUndefined();
    });
    it("Check, if i18nCommonModel is setup correctly", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty", "getResourceBundle" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);

        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {
                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
                }
            }
        });
        var comp = new testComp();
        expect(comp.getModel("i18nCommon")).not.toBeUndefined();
    });
    it("Check, if deviceModel is setup correctly", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {
                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle"
                }
            }
        });
        var comp = new testComp();
        expect(comp.getModel("device")).not.toBeUndefined();
        expect(comp.getModel("device").getData()).not.toBeUndefined();
        var data = comp.getModel("device").getData();
        expect(data.hasOwnProperty("isTouch"));
        expect(data.hasOwnProperty("isNoTouch"));
        expect(data.hasOwnProperty("isPhone"));
        expect(data.hasOwnProperty("isNoPhone"));
        expect(data.hasOwnProperty("isTablet"));
        expect(data.hasOwnProperty("isLandscape"));
        expect(data.hasOwnProperty("isPortrait"));
        expect(data.hasOwnProperty("isLargeDesktopWidth"));
        expect(data.hasOwnProperty("listItemType"));
        expect(data.hasOwnProperty("listMode"));
        expect(data.isTouch).not.toBe(data.isNoTouch);
        expect(data.isPhone).not.toBe(data.isNoPhone);
    });
    it("Check, if xsrf are load correctly", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var Commons = jasmine.createSpyObj("Commons", [ "getXCSRFTokenAsync" ]);
        var EnumService = jasmine.createSpyObj("EnumService", [ "loadEnumsAsync" ]);
        var promise = jasmine.createSpyObj("promise", [ "done" ]);

        Commons.getXCSRFTokenAsync.and.returnValue(promise);
        spyOn(sap.secmon.ui.commons, "EnumService").and.returnValue(EnumService);
        spyOn(sap.secmon.ui.commons, "CommonFunctions").and.returnValue(Commons);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                        loadCSRFToken : true,
                    // loadEnums : "sap.secmon.ui.m.valuelist"
                    }
                }
            }
        });
        var comp = new testComp();
        expect(Commons.getXCSRFTokenAsync).toHaveBeenCalled();
        expect(EnumService.loadEnumsAsync).not.toHaveBeenCalled();
    });
    it("Check, if enums are load correctly", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var Commons = jasmine.createSpyObj("Commons", [ "getXCSRFTokenAsync" ]);
        var EnumService = jasmine.createSpyObj("EnumService", [ "loadEnumsAsync" ]);
        var promise = jasmine.createSpyObj("promise", [ "done" ]);
        Commons.getXCSRFTokenAsync.and.returnValue(promise);
        EnumService.loadEnumsAsync.and.returnValue(promise);
        spyOn(sap.secmon.ui.commons, "EnumService").and.returnValue(EnumService);
        spyOn(sap.secmon.ui.commons, "CommonFunctions").and.returnValue(Commons);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                        // loadCSRFToken : true,
                        loadEnums : "sap.secmon.ui.m.valuelist"
                    }
                }
            }
        });
        var comp = new testComp();
        expect(Commons.getXCSRFTokenAsync).not.toHaveBeenCalled();
        expect(EnumService.loadEnumsAsync).toHaveBeenCalled();
        var doneHandler = promise.done.calls.argsFor(0);
        doneHandler[0]([ {
            "Object" : "Test"
        } ]);
        expect(comp.getModel("enums")).not.toBeUndefined();
    });
    it("Check, if Hana users are loaded correctly ", function() {
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        spyOn($, "ajax");
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                        // loadCSRFToken : true,
                        loadHanaUsers : true
                    }
                }
            }
        });
        var comp = new testComp();
        expect($.ajax).toHaveBeenCalled();

    });
    it("Check, if PatternModel is loaded correctly", function() {
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        spyOn($, "ajax");
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                        // loadCSRFToken : true,
                        loadPatternDefinitions : true
                    }
                }
            }
        });
        var comp = new testComp();
        expect($.ajax).toHaveBeenCalled();

    });
    it("Check setDefaultDataModel", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                    // loadCSRFToken : true,
                    // loadPatternDefinitions : true
                    },
                    serviceConfig : {
                        name : "Investigations",
                        serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
                    },
                }
            }
        });
        var comp = new testComp();
        comp.setDefaultODataModel("serviceConfig");
        expect(comp.getModel()).not.toBeUndefined();
    });
    it("Check set oDataModel", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);
        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                    // loadCSRFToken : true,
                    // loadPatternDefinitions : true
                    },
                    serviceConfig : {
                        name : "Investigations",
                        serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
                    },
                }
            }
        });
        var comp = new testComp();
        comp.setODataModel("serviceConfig");
        expect(comp.getModel()).toBeUndefined();
        expect(comp.getModel("Investigations")).not.toBeUndefined();
        expect(odataModel.attachRequestFailed).toHaveBeenCalled();
    });
    it("Check navigation veto collector", function() {
        spyOn($, "ajax");
        var i18nModel = jasmine.createSpyObj("i18nModel", [ "getProperty" ]);
        spyOn(sap.ui.model.resource, [ "ResourceModel" ]).and.returnValue(i18nModel);

        var testComp = libUnderTest.extend("test.sap.secmon.ui.commons.m.EtdComponentTest", {
            metadata : {

                config : {
                    resourceBundle : "/main/sap/secmon/ui/m/valuelist/i18n/UIText.hdbtextbundle",
                    backendConfig : {
                    // loadCSRFToken : true,
                    // loadPatternDefinitions : true
                    },
                    serviceConfig : {
                        name : "Investigations",
                        serviceUrl : "/sap/secmon/services/ui/m/invest/investigation.xsodata"
                    },
                }
            }
        });
        var comp = new testComp();

        expect(comp.getNavigationVetoCollector()).not.toBeUndefined();
        expect(comp.navigationVetoCollector).not.toBeUndefined();
    });

});