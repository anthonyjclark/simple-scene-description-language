grammar Ssdl

// TODO: what are interfaces for in grammars

// Concepts
// - inertial (origin, mass, inertia)
// - visual (origin, geometry (box, etc.), material (color, texture))
// - collision (origin, geometry)
// - joints (parent, child, origin, axis, etc.)

// TODO: entry with scene instead of robot?


entry Robot:
    'robot' name=ID (definitions+=Definition | statements+=Statement)*;

// ----------------------------------------------------------------
// ▗▄▄         ▄▄   █         █         █
// ▐▛▀█       ▐▛▀   ▀         ▀   ▐▌    ▀
// ▐▌ ▐▌ ▟█▙ ▐███  ██  ▐▙██▖ ██  ▐███  ██   ▟█▙ ▐▙██▖▗▟██▖
// ▐▌ ▐▌▐▙▄▟▌ ▐▌    █  ▐▛ ▐▌  █   ▐▌    █  ▐▛ ▜▌▐▛ ▐▌▐▙▄▖▘
// ▐▌ ▐▌▐▛▀▀▘ ▐▌    █  ▐▌ ▐▌  █   ▐▌    █  ▐▌ ▐▌▐▌ ▐▌ ▀▀█▖
// ▐▙▄█ ▝█▄▄▌ ▐▌  ▗▄█▄▖▐▌ ▐▌▗▄█▄▖ ▐▙▄ ▗▄█▄▖▝█▄█▘▐▌ ▐▌▐▄▄▟▌
// ▝▀▀   ▝▀▀  ▝▘  ▝▀▀▀▘▝▘ ▝▘▝▀▀▀▘  ▀▀ ▝▀▀▀▘ ▝▀▘ ▝▘ ▝▘ ▀▀▀
// ----------------------------------------------------------------

// TODO: allow definition of a function for computing a value?
Definition:
    ConstantDef | MacroDef;

// TODO: Property? (matches xacro)
// TODO: how to reference constant/property
ConstantDef:
    'let' name=ID '=' expression=Expression;

// TODO: add parameters and definition (similar to a statement but interpreted differently)
// TODO: types? defaults? overloading?
MacroDef:
    'macro' name=ID '(' MacroParameters ')' Block;

fragment MacroParameters:
    (parameters+=Parameter (',' parameters+=Parameter)*)?;

Parameter:
    name=ID;

fragment Block:
    '{' body+=Statement* '}';

// ----------------------------------------------------------------
//  ▗▄▖
// ▗▛▀▜  ▐▌        ▐▌                       ▐▌
// ▐▙   ▐███  ▟██▖▐███  ▟█▙ ▐█▙█▖ ▟█▙ ▐▙██▖▐███ ▗▟██▖
//  ▜█▙  ▐▌   ▘▄▟▌ ▐▌  ▐▙▄▟▌▐▌█▐▌▐▙▄▟▌▐▛ ▐▌ ▐▌  ▐▙▄▖▘
//    ▜▌ ▐▌  ▗█▀▜▌ ▐▌  ▐▛▀▀▘▐▌█▐▌▐▛▀▀▘▐▌ ▐▌ ▐▌   ▀▀█▖
// ▐▄▄▟▘ ▐▙▄ ▐▙▄█▌ ▐▙▄ ▝█▄▄▌▐▌█▐▌▝█▄▄▌▐▌ ▐▌ ▐▙▄ ▐▄▄▟▌
//  ▀▀▘   ▀▀  ▀▀▝▘  ▀▀  ▝▀▀ ▝▘▀▝▘ ▝▀▀ ▝▘ ▝▘  ▀▀  ▀▀▀
// ----------------------------------------------------------------

// TODO:
// Body types: box, sphere, cylinder, capsule, mesh, ...
// Joint types: revolute, prismatic, fixed, ...
// for loop, if statement
// TODO: use guard to check if defining a macro or not?
Statement:
    Body | Joint | MacroCall | ForLoop;

// TODO: capsule? mesh? others?
Body:
    Name '=' shape=(Box | Cylinder | Sphere);

fragment Name:
    (name=ID) | (self='self' '.' name=ID);

// TODO: make size required as in URDF? or optional
Box:
    'Box' '{'
    ('size' '=' size=Vector3)
    BodyAttributes '}';

Cylinder:
    'Cylinder' '{'
    ('length' '=' length=Expression)?
    ('radius' '=' radius=Expression)?
    BodyAttributes '}';

Sphere:
    'Sphere' '{'
    ('radius' '=' radius=Expression)?
    BodyAttributes '}';

// TODO: inertial, visual, collision all optional
// inertial: origin, mass, inertia
// visual: origin, geometry (box, cylinder, sphere, mesh), material (color, texture)
// collision: origin, geometry
// TODO: color types rgb, hsv, rgba, hex (3 and 6), names
fragment BodyAttributes:
    ('position' '=' position=Vector3)?
    ('rotation' '=' rotation=Vector3)?;

// TODO: others? universtal?
// TODO: limit is required for revolute and prismatic
Joint:
    Name '=' jtype=(Revolute | Prismatic | Fixed);

Revolute:
    'Revolute' '{'
    JointAttributes
    ('limit' '=' limit=Expression)? '}';

Prismatic:
    'Prismatic' '{' JointAttributes '}';

Fixed:
    'Fixed' '{' JointAttributes '}';

// TODO: upper and lower limits
// TODO: move some to specific joints?
fragment JointAttributes:
    ('parent' '=' parent=NameLabel)
    ('child' '=' child=NameLabel)
    ('position' '=' position=Vector3)?
    ('rotation' '=' rotation=Vector3)?
    ('axis' '=' axis=Vector3)?
    ('maxEffort' '=' maxEffort=Expression)?
    ('maxVelocity' '=' maxVelocity=Expression)?
    ('lowerAngleLimit' '=' lowerAngleLimit=Expression)?
    ('upperAngleLimit' '=' upperAngleLimit=Expression)?;

NameLabel:
    (name=ID) | (self='self' '.' name=ID);

// TODO: require named arguments?
MacroCall:
    Name '='
    macro=[MacroDef:ID]
    '(' (arguments+=Expression (',' arguments+=Expression)*)? ')';

ForLoop:
    'for' var=Parameter 'in' start=Expression 'to' end=Expression Block;

// ----------------------------------------------------------------
// ▗▄▄▄▖                                █
// ▐▛▀▀▘                                ▀
// ▐▌   ▝█ █▘▐▙█▙  █▟█▌ ▟█▙ ▗▟██▖▗▟██▖ ██   ▟█▙ ▐▙██▖▗▟██▖
// ▐███  ▐█▌ ▐▛ ▜▌ █▘  ▐▙▄▟▌▐▙▄▖▘▐▙▄▖▘  █  ▐▛ ▜▌▐▛ ▐▌▐▙▄▖▘
// ▐▌    ▗█▖ ▐▌ ▐▌ █   ▐▛▀▀▘ ▀▀█▖ ▀▀█▖  █  ▐▌ ▐▌▐▌ ▐▌ ▀▀█▖
// ▐▙▄▄▖ ▟▀▙ ▐█▄█▘ █   ▝█▄▄▌▐▄▄▟▌▐▄▄▟▌▗▄█▄▖▝█▄█▘▐▌ ▐▌▐▄▄▟▌
// ▝▀▀▀▘▝▀ ▀▘▐▌▀▘  ▀    ▝▀▀  ▀▀▀  ▀▀▀ ▝▀▀▀▘ ▝▀▘ ▝▘ ▝▘ ▀▀▀
//           ▐▌
// ----------------------------------------------------------------

Expression:
    Addition;

Addition infers Expression:
    Multiplication ({infer BinaryExpression.lhs=current} op=('+' | '-') rhs=Multiplication)*;

Multiplication infers Expression:
    Atomic ({infer BinaryExpression.lhs=current} op=('*' | '/') rhs=Atomic)*;

// TODO: function calls? built-in and user-defined
// TODO: cannot handle multiple scopes for reference
Atomic infers Expression:
    {infer Parenthesized} '(' expression=Expression ')' |
    {infer NumberLiteral} value=NUMBER units=Units? |
    {infer ValueReference} name=ID;

Vector3:
    a=Expression ',' b=Expression ',' c=Expression;

Units returns string:
    'm' | 'cm' | 'mm' | 'rad' | 'deg' | 'g/cm^3';

// ----------------------------------------------------------------
// ▗▄▄▄▖                 █            ▗▄▖
// ▝▀█▀▘                 ▀            ▝▜▌
//   █   ▟█▙  █▟█▌▐█▙█▖ ██  ▐▙██▖ ▟██▖ ▐▌  ▗▟██▖
//   █  ▐▙▄▟▌ █▘  ▐▌█▐▌  █  ▐▛ ▐▌ ▘▄▟▌ ▐▌  ▐▙▄▖▘
//   █  ▐▛▀▀▘ █   ▐▌█▐▌  █  ▐▌ ▐▌▗█▀▜▌ ▐▌   ▀▀█▖
//   █  ▝█▄▄▌ █   ▐▌█▐▌▗▄█▄▖▐▌ ▐▌▐▙▄█▌ ▐▙▄ ▐▄▄▟▌
//   ▀   ▝▀▀  ▀   ▝▘▀▝▘▝▀▀▀▘▝▘ ▝▘ ▀▀▝▘  ▀▀  ▀▀▀
// ----------------------------------------------------------------

hidden terminal WS: /\s+/;
terminal ID: /[_a-zA-Z][\w_]*/;
terminal NUMBER returns number: /-?[0-9]+(\.[0-9]+)?/;
// terminal STRING: /"(\\.|[^"\\])*"|'(\\.|[^'\\])*'/;
// terminal HEX returns string:    /#(\d|[a-fA-F])+/;

hidden terminal SL_COMMENT: /\/\/[^\n\r]*/;
