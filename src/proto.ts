import protobuf from 'protobufjs';
import data from './proto.json';

const root = protobuf.Root.fromJSON(data);

const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name);

// TODO make these set of functions work through generics <T extends protobuf.ReflectionObject>

export const namespaces = (
  namespace: protobuf.Namespace
): protobuf.Namespace[] => {
  const namespaces = namespace.nestedArray.filter(
    (o): o is protobuf.Service => o instanceof protobuf.Namespace
  );
  namespaces.sort(byName);
  return namespaces;
};

export const services = (namespace: protobuf.Namespace): protobuf.Service[] => {
  const services = namespace.nestedArray.filter(
    (o): o is protobuf.Service => o instanceof protobuf.Service
  );
  services.sort(byName);
  return services;
};

export const messages = (namespace: protobuf.Namespace): protobuf.Type[] => {
  const messages = namespace.nestedArray.filter(
    (o): o is protobuf.Type => o instanceof protobuf.Type
  );
  messages.sort(byName);
  return messages;
};

export const enums = (namespace: protobuf.Namespace): protobuf.Enum[] => {
  const enums = namespace.nestedArray.filter(
    (o): o is protobuf.Enum => o instanceof protobuf.Enum
  );
  enums.sort(byName);
  return enums;
};

export const methods = (srv: protobuf.Service): protobuf.Method[] => {
  const methods = [...srv.methodsArray];
  methods.sort(byName);
  return methods;
};

export const parentOf = (
  parent: protobuf.ReflectionObject,
  child: protobuf.ReflectionObject | null
): boolean => {
  return child ? heirarchy(child).includes(parent) : false;
};

export const heirarchy = (
  obj: protobuf.ReflectionObject
): protobuf.ReflectionObject[] =>
  obj.parent === null || obj.parent instanceof protobuf.Root
    ? [obj]
    : [...heirarchy(obj.parent), obj];

// Produces a JSON object that is a template for a given message.
export const jsonTemplate = (message: protobuf.Type): any => {
  const tmpl: any = {};
  message.fieldsArray.forEach(field => {
    // TODO better handling of repeated template - should probably fill out 1 value.
    if (field.repeated) {
      tmpl[field.name] = [];
      return;
    }
    if (
      field.resolvedType !== null &&
      field.resolvedType instanceof protobuf.Type
    ) {
      tmpl[field.name] = jsonTemplate(field.resolvedType);
      return;
    }
    switch (field.type) {
      case 'int32':
      case 'int64':
      case 'float':
        tmpl[field.name] = 0;
        break;
      case 'string':
        tmpl[field.name] = '';
        break;
      default:
        console.error('unknown type:', field.type);
        break;
    }
  });
  return tmpl;
};

// Returns obj.fullName without the first period.
export const fullName = (obj: protobuf.ReflectionObject): string => {
  return obj.fullName[0] === '.' ? obj.fullName.substr(1) : obj.fullName;
};

// Add global reference to window for easier debugging.
declare global {
  interface Window {
    root: protobuf.Root;
  }
}
window.root = root;

export default root;
