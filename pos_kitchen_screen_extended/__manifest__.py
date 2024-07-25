# -*- coding: utf-8 -*-
{
    'name': 'POS Kitchen Screen Extended',
    'depends': ['base', 'point_of_sale', 'aspl_pos_kitchen_screen', 'partner_autocomplete'],
    'data': [
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/pos_order_views.xml',
        'views/reason_for_call_views.xml',
    ],
    'qweb': ['static/src/xml/pos.xml'],
    'installable': True,
    'application': True,
    'auto_install': False,
}
