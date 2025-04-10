grammar Ssdl

// TODO: what are interfaces for in grammars

entry Robot:
    'name' name=ID (configurations+=Configurations)* (definitions+=Definition | statements+=Statement)*;

// TODO:
// - default units?
Configurations:
    'set' ( name='visual_scale'   '=' value=NUMBER
          | name='snap_to_ground' '=' value=('true' | 'false'));

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

// Change parameter to name=ID?
fragment MacroParameters:
    (parameters+=Parameter (',' parameters+=Parameter)*)?;

Parameter:
    name=ID;

fragment Block:
    '{' (definitions+=Definition | statements+=Statement)* '}';

// ----------------------------------------------------------------
//  ▗▄▖
// ▗▛▀▜  ▐▌        ▐▌                       ▐▌
// ▐▙   ▐███  ▟██▖▐███  ▟█▙ ▐█▙█▖ ▟█▙ ▐▙██▖▐███ ▗▟██▖
//  ▜█▙  ▐▌   ▘▄▟▌ ▐▌  ▐▙▄▟▌▐▌█▐▌▐▙▄▟▌▐▛ ▐▌ ▐▌  ▐▙▄▖▘
//    ▜▌ ▐▌  ▗█▀▜▌ ▐▌  ▐▛▀▀▘▐▌█▐▌▐▛▀▀▘▐▌ ▐▌ ▐▌   ▀▀█▖
// ▐▄▄▟▘ ▐▙▄ ▐▙▄█▌ ▐▙▄ ▝█▄▄▌▐▌█▐▌▝█▄▄▌▐▌ ▐▌ ▐▙▄ ▐▄▄▟▌
//  ▀▀▘   ▀▀  ▀▀▝▘  ▀▀  ▝▀▀ ▝▘▀▝▘ ▝▀▀ ▝▘ ▝▘  ▀▀  ▀▀▀
// ----------------------------------------------------------------

// TODO: if statement
Statement:
    Body | Joint | MacroCall | ForLoop;

// TODO: capsule? mesh? others?
Body:
    name=ID '=' shape=(Box | Cylinder | Sphere);

// TODO: add a flag to disable?: noVisual=true, --no-visual
// TODO: visual -> geometry -> mesh
// TODO: visual -> material -> texture
// TODO: color types rgb, hsv, rgba, hex (3 and 6), names
// TODO: allow inertial, collision, visual to have differing attributes/values (e.g., origin -> xyz)
// TODO: allow multiple collision shapes
// TODO: allow multiple visual shapes
// TODO: does the strict order matter?
// TODO: visualize even when no visual is given? maybe make transparent?

fragment BodyAttributes:
    ('position' '=' position=Vector3)?
    ('rotation' '=' rotation=Vector3)?
    ('density' '=' density=Expression)?
    ('ixx' '=' ixx=Expression)?
    ('ixy' '=' ixy=Expression)?
    ('ixz' '=' ixz=Expression)?
    ('iyy' '=' iyy=Expression)?
    ('iyz' '=' iyz=Expression)?
    ('izz' '=' izz=Expression)?
    ('color' '=' color=RGBA)?;

Box:
    'Box' '{'
        ('size' '=' size=Vector3)?
        BodyAttributes
    '}';

Cylinder:
    'Cylinder' '{'
        ('length' '=' length=Expression)?
        ('radius' '=' radius=Expression)?
        ('up' '=' up=('z-axis' | 'x-axis' | 'y-axis'))?
        BodyAttributes
    '}';

Sphere:
    'Sphere' '{'
        ('radius' '=' radius=Expression)?
        BodyAttributes
    '}';


// TODO: others? universal?
// TODO: limit is required for revolute and prismatic
Joint:
    name=ID '=' jtype=(Revolute | Prismatic | Fixed);

// TODO: upper and lower limits
// TODO: move some to specific joints?
fragment JointAttributes:
    ('parent' '=' parent=ID)
    ('child' '=' child=ID)
    ('position' '=' position=Vector3)?
    ('rotation' '=' rotation=Vector3)?
    ('axis' '=' axis=Vector3)?
    ('maxEffort' '=' maxEffort=Expression)?
    ('maxVelocity' '=' maxVelocity=Expression)?
    ('lowerAngleLimit' '=' lowerAngleLimit=Expression)?
    ('upperAngleLimit' '=' upperAngleLimit=Expression)?;

Revolute:
    'Revolute' '{'
        JointAttributes
        ('limit' '=' limit=Expression)?
    '}';

Prismatic:
    'Prismatic' '{'
        JointAttributes
    '}';

Fixed:
    'Fixed' '{'
        JointAttributes
    '}';

// TODO: require named arguments?
MacroCall:
    name=ID '=' macro=[MacroDef:ID] '(' (arguments+=Expression (',' arguments+=Expression)*)? ')';

// TODO: change to 'loop' with ability to act as while or for loop?
ForLoop:
    // 'for' var=Parameter 'in' start=Expression 'to' end=Expression Block;
    'for' var=ID 'in' range=Expression Block;

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

Atomic infers Expression:
    {infer Parenthesized} '(' expression=Expression ')' |
    {infer NumberLiteral} value=NUMBER units=Units? |
    // {infer LengthLiteral} value=NUMBER units=LengthUnits? |
    {infer ValueReference} name=ID |
    {infer FunctionCall} function=ID '(' argument=Expression ')';

Vector3:
    a=Expression ',' b=Expression ',' c=Expression;

RGBA:
    r=Expression ',' c=Expression ',' b=Expression ',' a=Expression;

// A good resource for units: https://numbat.dev/doc/list-units.html
Units returns string:
    LengthUnits | AngleUnits | MassUnits | DensityUnits;

LengthUnits returns string:
    'm' | 'cm' | 'mm';

AngleUnits returns string:
    'rad' | 'deg';

MassUnits returns string:
    'g' | 'kg';

DensityUnits returns string:
    'g/cm^3' | 'kg/m^3';

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
