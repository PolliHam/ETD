jQuery.sap.require("sap.secmon.ui.m.changelog.util.Formatter");
jQuery.sap.require("test.TestHelper");

describe("changelog Formatter", function(){
    var libUnderTest;
    var spy, oModel, oView;
    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.changelog.util.Formatter;
        oModel = test.TestHelper.createMockModel();
        oView = test.TestHelper.createMockView();
        enumServiceSpy = spyOn(sap.secmon.ui.m.changelog.util.Formatter.oEnumService, "getEnumValue");
    });

    
    describe('entityTypeFormatter', function() {
        it("enumModel exists", function() {
            oView.getModel.and.returnValue(oModel);
            sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue.and.returnValue('Enum');
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityTypeFormatter.call(oView,'Type')).toBe('Enum');
        }); 
        it("enumModel does not exist", function() {
            sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue.and.returnValue('Enum');
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityTypeFormatter.call(oView,'Type')).toBe('Type');
            
        });
    });
    describe('entityOperationFormatter ', function() {
        it("enumModel exists", function() {
            oView.getModel.and.returnValue(oModel);
            sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue.and.returnValue('Enum');
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityOperationFormatter .call(oView,'Operation')).toBe('Enum');
        }); 
        it("enumModel does not exist", function() {
            sap.secmon.ui.m.changelog.util.Formatter.oEnumService.getEnumValue.and.returnValue('Enum');
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityOperationFormatter .call(oView,'Operation')).toBe('Operation');
            
        });
    });
    describe("entityNamespaceFormatter", function() {
        it("with entityNamespace", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityNamespaceFormatter('EntityNamespace', 'emptyNamespace')).toBe("EntityNamespace");
        });
        it("with entityNamespace equal space", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityNamespaceFormatter('', 'emptyNamespace')).toBe("emptyNamespace");
        });
        it("without entityNamespace", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityNamespaceFormatter(null, 'emptyNamespace')).toBe(null);
        });
        it("with undefined entityNamespace", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityNamespaceFormatter(undefined, 'emptyNamespace')).toBe(undefined);
        });
    });
    describe("columnListItemTypeFormatter", function() {
        it("no serialized object length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(null, undefined)).toBe("Inactive");
        });
        it("no serialized object length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(undefined, undefined)).toBe("Inactive");
        });
        it("no serialized object length, but non zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(undefined, 1)).toBe("Inactive");
        });
        it("non zero serialized object length, but no new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(1, undefined)).toBe("Inactive");
        });
        it("zero serialized object length, but no new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(0, undefined)).toBe("Inactive");
        });
        it("zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(0, 0)).toBe("Inactive");
        });
        it("zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter('0', 0)).toBe("Inactive");
        });
        it("zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(0, '0')).toBe("Inactive"); 
        });
       it("non zero serialized object length, and non zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(1, 1)).toBe("Navigation");
        });
        it("string zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter('1', 1)).toBe("Navigation");
        });
        it("string zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter(1, '1')).toBe("Navigation");
        });
        it("string zero serialized object length, and zero new length", function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.columnListItemTypeFormatter('1', '1')).toBe("Navigation");
        });
    });
    describe('entityHistoryURLEnabled', function(){
        it('Entity Type Alert', function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityHistoryURLEnabled('ALERT')).toBeTruthy();
        });
        it('Entity Type Investigation', function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityHistoryURLEnabled('INVESTIGATION')).toBeTruthy();
        });
        it('Entity nothing of both', function() {
            expect(sap.secmon.ui.m.changelog.util.Formatter.entityHistoryURLEnabled('EVENT')).not.toBeTruthy();
        });
       
    });
    
    describe('entityHistoryURL', function() {
       beforeEach(function() {
           spyOn(sap.secmon.ui.m.commons.NavigationService, 'alertURL');
           spyOn(sap.secmon.ui.m.commons.NavigationService, 'investigationURL');
       }); 
       it('Entity Type Alert', function() {
           sap.secmon.ui.m.changelog.util.Formatter.entityHistoryURL('12', 'ALERT');
           expect(sap.secmon.ui.m.commons.NavigationService.alertURL).toHaveBeenCalledWith('12', "Comments");
           expect(sap.secmon.ui.m.commons.NavigationService.investigationURL).not.toHaveBeenCalled();
       });
       it('Entity Type Investigation', function() {
           sap.secmon.ui.m.changelog.util.Formatter.entityHistoryURL('12', 'INVESTIGATION');
           expect(sap.secmon.ui.m.commons.NavigationService.investigationURL).toHaveBeenCalledWith('12', "discussion");
           expect(sap.secmon.ui.m.commons.NavigationService.alertURL).not.toHaveBeenCalled();
       });
      
    });
       
});