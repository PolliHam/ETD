jQuery.sap.require("sap.secmon.ui.m.commons.controls.RadioButtonGrid");
jQuery.sap.require("sap.secmon.ui.m.commons.controls.RadioButton");

describe("RadioButtonGrid", function() {
    
    it("RadioButtonGrid Test", function() {
        var oGrid = new sap.secmon.ui.m.commons.controls.RadioButtonGrid({
            id : "Grid"
        });
        var oNoButton = new sap.secmon.ui.m.commons.controls.RadioButton({
            text : "No",
            key : "NO"
        });
        var oYesButton = new sap.secmon.ui.m.commons.controls.RadioButton({
            text : "Yes",
            key : "YES"
        });
        var oMaybeButton = new sap.secmon.ui.m.commons.controls.RadioButton({
            text : "Maybe",
            key : "MAYBE"
        });
        var oOftenButton = new sap.secmon.ui.m.commons.controls.RadioButton({
            text : "Often",
            key : "OFTEN"
        });
        
        oGrid.addButton(oNoButton);
        oGrid.addButton(oYesButton);
        
        var aButtons = oGrid.getButtons();
        expect(aButtons.length).toBe(2);
        expect(aButtons[0].getText()).toBe("No");
        expect(aButtons[0].getKey()).toBe("NO");
        expect(aButtons[0].getSelected()).toBe(false);
        expect(aButtons[0].getEnabled()).toBe(true);
        expect(aButtons[1].getText()).toBe("Yes");
        expect(aButtons[1].getKey()).toBe("YES");
        expect(aButtons[1].getSelected()).toBe(false);
        expect(aButtons[1].getEnabled()).toBe(true);
        
        //selectedKey
        expect(oGrid.getSelectedKey()).toBe(null);
        oGrid.setSelectedKey(oYesButton.getKey());
        expect(oGrid.getSelectedKey()).toBe(oYesButton.getKey());
        //select the already selected again;
        oGrid.setSelectedKey(oYesButton.getKey());
        
        aButtons = oGrid.getButtons();
        expect(aButtons[0].getSelected()).toBe(false);
        expect(aButtons[1].getSelected()).toBe(true);

        oGrid.setSelectedKey(oNoButton.getKey());
        expect(oGrid.getSelectedKey()).toBe(oNoButton.getKey());
        
        aButtons = oGrid.getButtons();
        expect(aButtons[0].getSelected()).toBe(true);
        expect(aButtons[1].getSelected()).toBe(false);
        
        //insert Button
        oGrid.setSelectedKey("MAYBE");
        oGrid.insertButton(oMaybeButton,1);
        aButtons = oGrid.getButtons();
        expect(aButtons.length).toBe(3);
        expect(aButtons[0].getText()).toBe("No");
        expect(aButtons[0].getKey()).toBe("NO");
        expect(aButtons[0].getSelected()).toBe(false);
        expect(aButtons[0].getEnabled()).toBe(true);
        expect(oGrid.indexOfButton(aButtons[1])).toBe(1);
        expect(aButtons[1].getText()).toBe("Maybe");
        expect(aButtons[1].getKey()).toBe("MAYBE");
        expect(aButtons[1].getSelected()).toBe(true);
        expect(aButtons[1].getEnabled()).toBe(true);
        expect(aButtons[2].getText()).toBe("Yes");
        expect(aButtons[2].getKey()).toBe("YES");
        expect(aButtons[2].getSelected()).toBe(false);
        expect(aButtons[2].getEnabled()).toBe(true);
        
        //add often Button
        oGrid.setSelectedKey("OFTEN");
        oGrid.addButton(oOftenButton);

        aButtons = oGrid.getButtons();
        expect(aButtons.length).toBe(4);
        expect(aButtons[0].getText()).toBe("No");
        expect(aButtons[0].getKey()).toBe("NO");
        expect(aButtons[0].getSelected()).toBe(false);
        expect(aButtons[0].getEnabled()).toBe(true);
        expect(aButtons[1].getText()).toBe("Maybe");
        expect(aButtons[1].getKey()).toBe("MAYBE");
        expect(aButtons[1].getSelected()).toBe(false);
        expect(aButtons[1].getEnabled()).toBe(true);
        expect(aButtons[2].getText()).toBe("Yes");
        expect(aButtons[2].getKey()).toBe("YES");
        expect(aButtons[2].getSelected()).toBe(false);
        expect(aButtons[2].getEnabled()).toBe(true);
        expect(aButtons[3].getText()).toBe("Often");
        expect(aButtons[3].getKey()).toBe("OFTEN");
        expect(aButtons[3].getSelected()).toBe(true);
        expect(aButtons[3].getEnabled()).toBe(true);
        oGrid.removeButton(oOftenButton);
        
        
        //disable Maybe Button
        oGrid.setEnabledByKey("MAYBE", false);
        expect(oMaybeButton.getEnabled()).toBe(false);
        
        //remove Maybe Button
        oGrid.removeButton(oMaybeButton);
        aButtons = oGrid.getButtons();
        expect(aButtons.length).toBe(2);
        expect(aButtons[0].getText()).toBe("No");
        expect(aButtons[0].getKey()).toBe("NO");
        expect(aButtons[0].getSelected()).toBe(false);
        expect(aButtons[1].getText()).toBe("Yes");
        expect(aButtons[1].getKey()).toBe("YES");
        expect(aButtons[1].getSelected()).toBe(false);
        
        
          
        
        oGrid.removeAllButtons();

        aButtons = oGrid.getButtons();
        expect(aButtons.length).toBe(0);
    });
});