odoo.define('pos_kitchen_screen_extended.popup',function (require) {
    "use strict";
    var models = require('point_of_sale.models');

    models.load_models([{
        model: 'reason.for.call',
        loaded: function(self, reason_for_call){
            self.reason_for_call = reason_for_call;
        },
    }]);

    var _super_Order = models.Order.prototype;
    models.Order = models.Order.extend({
        set_pos_branch: function(branch){
            this.pos_branch_id = branch;
        },
        get_pos_branch: function(){
            return this.pos_branch_id;
        },
        export_as_JSON: function() {
            var submitted_order = _super_Order.export_as_JSON.call(this);
            var new_val = {
                delivery_address: this.delivery_address,
                delivery_phone: this.delivery_phone,
                delivery_date: this.delivery_date,
                note: this.note
            }
            $.extend(submitted_order, new_val);
            console.log("submitted_order", submitted_order)
            return submitted_order;
        },
    });
});