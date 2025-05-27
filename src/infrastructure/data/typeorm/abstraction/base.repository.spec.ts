import { mockDeep } from 'jest-mock-extended';
import { Repository } from 'typeorm';
import { BaseRepository } from './base.repository';

describe('BaseRepository', () => {
  const repository = mockDeep<Repository<any>>();
  const makeSut = () => {
    return new BaseRepository<any>(repository as any);
  };

  describe('create', () => {
    it('should call create method from repository', async () => {
      const sut = makeSut();
      const dto = {};
      const createSpy = jest.spyOn(repository, 'create');
      await sut.create(dto);
      expect(createSpy).toHaveBeenCalledWith(dto);
    });

    it('should call save method from repository', async () => {
      const sut = makeSut();
      const dto = {};
      const saveSpy = jest.spyOn(repository, 'save');
      await sut.create(dto);
      expect(saveSpy).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should call findOne method from repository', async () => {
      const sut = makeSut();
      const query = {};
      const findOneSpy = jest.spyOn(repository, 'findOne');
      await sut.findOne(query);
      expect(findOneSpy).toHaveBeenCalledWith({ where: query });
    });
  });

  describe('find', () => {
    it('should call find method from repository', async () => {
      const sut = makeSut();
      const query = {};
      const findSpy = jest.spyOn(repository, 'find');
      await sut.find(query);
      expect(findSpy).toHaveBeenCalledWith({ where: query });
    });
  });

  describe('update', () => {
    it('should call find and save method from repository', async () => {
      const sut = makeSut();
      const query = {};
      const dto = {};
      const findSpy = jest.spyOn(repository, 'find');
      findSpy.mockResolvedValueOnce([{}]);
      const saveSpy = jest.spyOn(repository, 'save');

      await sut.update(query, dto);

      expect(findSpy).toHaveBeenCalledWith({ where: query });
      expect(saveSpy).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('delete', () => {
    it('should call findOne and softRemove method from repository', async () => {
      const sut = makeSut();
      const query = {};
      const findOneSpy = jest.spyOn(repository, 'findOne');
      findOneSpy.mockResolvedValueOnce({});
      const softRemoveSpy = jest.spyOn(repository, 'softRemove');

      await sut.delete(query);

      expect(findOneSpy).toHaveBeenCalledWith({ where: query });
      expect(softRemoveSpy).toHaveBeenCalledWith({});
    });
  });
});
