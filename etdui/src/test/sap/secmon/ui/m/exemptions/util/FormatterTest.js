jQuery.sap.require("sap.secmon.ui.m.exemptions.util.Formatter");


describe("exemptions Formatter Tests", function(){
    var libUnderTest;
    var spy, oModel;


    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.exemptions.util.Formatter;
        spy = jasmine.createSpyObj("controller", ["getModel"]);
        oModel = jasmine.createSpyObj("oModel",["method","getProperty"]);
    });

    it("exemptionValidityFormatter Formatter", function() {
        var oDate = new Date(1479383515194);
        jQuery.sap.require("sap.ui.core.format.DateFormat");
        var sDateTime;
        var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
            style : "short"
        });
        sDateTime = oDateFormat.format(oDate) + " ";
        oDateFormat = sap.ui.core.format.DateFormat.getTimeInstance({
            style : "long"
        });
        sDateTime = sDateTime + oDateFormat.format(oDate);
        oModel.getProperty.and.returnValue("Exemption_Validity_Active {0}");
        spy.getModel.and.returnValue(oModel);
        expect(libUnderTest.exemptionValidityFormatter.call(spy, false, "ACTIVE", oDate)).toEqual("Exemption_Validity_Active " + sDateTime );
        
        oModel.getProperty.and.returnValue("Exemption_Validity_Planned {0}");
        expect(libUnderTest.exemptionValidityFormatter.call(spy, false, "PLANNED", oDate)).toEqual("Exemption_Validity_Planned " + sDateTime );
        
        oModel.getProperty.and.returnValue("Exemption_Validity_Expired {0}");
        expect(libUnderTest.exemptionValidityFormatter.call(spy, false, "EXPIRED", oDate)).toEqual("Exemption_Validity_Expired " + sDateTime );    
        expect(libUnderTest.exemptionValidityFormatter(false, "TEST", oDate)).toEqual();   
    });
    
});